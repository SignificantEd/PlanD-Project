export function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

const ROLE_PRIORITY = ['external_substitute', 'paraprofessional', 'internal_teacher'];

export async function assignCoverageForAbsence(prisma, absence) {
    const periods = absence.periods || [];
    const date = absence.date;
    const teacherId = absence.teacherId;
    let department = absence.department;
    const dayOfWeek = getDayOfWeek(new Date(date));
    
    // Only process Monday-Friday
    if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
        return [{
            period: 'all',
            assigned: null,
            assignedRole: null,
            reason: `No coverage assigned: ${dayOfWeek} is not a school day.`,
            candidateEvaluated: 0
        }];
    }

    // Get teacher department if not provided
    if (!department) {
        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        department = teacher?.department || undefined;
    }

    // Get periods needing coverage
    let periodsArray = [];
    if (absence.periods) {
        if (Array.isArray(absence.periods)) {
            periodsArray = absence.periods.map(p => String(p)).filter(p => p && p !== 'null');
        } else if (typeof absence.periods === 'string') {
            try {
                const parsed = JSON.parse(absence.periods);
                if (Array.isArray(parsed)) {
                    periodsArray = parsed.map(p => String(p)).filter(p => p && p !== 'null');
                }
            } catch (error) {
                console.log('Failed to parse periods JSON, falling back to master schedule');
            }
        }
    }
    
    if (!periodsArray.length) {
        // Fallback: get periods from master schedule
        const msEntries = await prisma.masterSchedule.findMany({ 
            where: { teacherId, dayOfWeek, isTeaching: true } 
        });
        periodsArray = msEntries.map(ms => ms.period);
    }

    const results = [];
    const dateStr = new Date(date).toISOString().split('T')[0];

    // Get all absences for this date (to avoid assigning absent staff)
    const absencesToday = await prisma.absence.findMany({ 
        where: { date: new Date(dateStr) } 
    });
    const absentIds = new Set(absencesToday.map(a => a.teacherId));

    // Get all coverage assignments for the date (to check load and conflicts)
    const coverageAssignments = await prisma.coverageAssignment.findMany({ 
        where: { absenceId: { in: absencesToday.map(a => a.id) } } 
    });

    // Get master schedule for the day
    const masterSchedule = await prisma.masterSchedule.findMany({ 
        where: { dayOfWeek } 
    });

    // Helper: Check if staff is available for a period
    function isAvailable(staffId, period) {
        // Check if already teaching
        const teaching = masterSchedule.find(ms => 
            ms.teacherId === staffId && ms.period === period && ms.isTeaching
        );
        if (teaching) return false;

        // Check if already covering
        const covering = coverageAssignments.find(ca => 
            ca[`period${period}`] === staffId
        );
        if (covering) return false;

        // Check if absent
        if (absentIds.has(staffId)) return false;

        return true;
    }

    // Helper: Check period availability match between absent teacher and candidate
    function getPeriodMatch(neededPeriods, availablePeriods) {
        const canCover = neededPeriods.filter(period => availablePeriods.includes(period));
        const cannotCover = neededPeriods.filter(period => !availablePeriods.includes(period));
        
        let matchType;
        if (canCover.length === 0) {
            matchType = 'none';
        } else if (canCover.length === neededPeriods.length) {
            matchType = 'perfect';
        } else {
            matchType = 'partial';
        }
        
        return { canCover, cannotCover, matchType };
    }

    // Helper: Get current load for a staff member
    function getCurrentLoad(staffId) {
        let load = 0;
        
        // Count teaching periods
        for (const ms of masterSchedule) {
            if (ms.teacherId === staffId && ms.isTeaching) load++;
        }
        
        // Count coverage assignments
        for (const ca of coverageAssignments) {
            if (Object.values(ca).includes(staffId)) load++;
        }
        
        return load;
    }

    // Helper: Check qualification match
    function hasQualificationMatch(candidate, subject) {
        // For substitutes, check subject specialties
        if (candidate.subjectSpecialties && candidate.subjectSpecialties.length > 0) {
            return candidate.subjectSpecialties.includes(subject);
        }
        
        // For internal staff, check department match
        if (department && candidate.department) {
            return candidate.department === department;
        }
        
        // Default: assume qualified if no specific requirements
        return true;
    }

    // Helper: Check special constraints
    async function checkSpecialConstraints(candidate, period) {
        // Check load limits
        if (candidate.currentLoad >= candidate.maxLoad) return false;
        
        // Check substitute daily limit (6 periods per day)
        if (candidate.role === 'external_substitute') {
            const currentDailyLoad = await getDailyLoadForSubstitute(candidate.id, date);
            if (currentDailyLoad >= 6) return false;
        }
        
        return true;
    }

    // Helper: Get daily load for a substitute
    async function getDailyLoadForSubstitute(substituteId, date) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        
        const existingAssignments = await prisma.coverageAssignment.findMany({
            where: {
                absence: {
                    date: new Date(dateStr)
                }
            }
        });
        
        let dailyLoad = 0;
        
        for (const assignment of existingAssignments) {
            for (const period of ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']) {
                if (assignment[`period${period}`] === substituteId) {
                    dailyLoad++;
                }
            }
        }
        
        return dailyLoad;
    }

    // Process all periods together to handle the three scenarios
    let allAssignments = {};
    let uncoveredPeriods = [...periodsArray];
    let candidatesEvaluated = 0;

    // Iterate through role priorities
    for (const role of ROLE_PRIORITY) {
        if (uncoveredPeriods.length === 0) break;

        let candidates = [];

        // Get candidates for this role
        switch (role) {
            case 'external_substitute':
                const allSubs = await prisma.substitute.findMany();
                console.log(`🔍 Found ${allSubs.length} substitutes total`);
                candidates = await Promise.all(allSubs.map(async (sub) => {
                    const availability = typeof sub.availability === 'string' 
                        ? JSON.parse(sub.availability) 
                        : sub.availability;
                    const currentLoad = getCurrentLoad(sub.id);
                    const maxLoad = sub.loadLimitConfigId 
                        ? (await prisma.loadLimitConfig.findUnique({ where: { id: sub.loadLimitConfigId } }))?.maxPeriodsPerDay || 6
                        : 6;
                    
                    console.log(`📋 Substitute ${sub.name}: availability=${JSON.stringify(availability[dayOfWeek])}, currentLoad=${currentLoad}, maxLoad=${maxLoad}, preferredTeacherId=${sub.preferredTeacherId}`);
                    
                    return {
                        id: sub.id,
                        name: sub.name,
                        role,
                        subjectSpecialties: Array.isArray(sub.subjectSpecialties) 
                            ? sub.subjectSpecialties 
                            : JSON.parse(sub.subjectSpecialties),
                        availability,
                        currentLoad,
                        maxLoad,
                        preferredTeacherId: sub.preferredTeacherId
                    };
                }));
                console.log(`✅ Processed ${candidates.length} substitute candidates`);
                break;

            case 'paraprofessional':
                const parapros = await prisma.user.findMany({ 
                    where: { role: 'paraprofessional' } 
                });
                candidates = parapros.map(para => ({
                    id: para.id,
                    name: para.name,
                    role,
                    department: para.department || undefined,
                    availability: {},
                    currentLoad: getCurrentLoad(para.id),
                    maxLoad: 6
                }));
                break;

            case 'internal_teacher':
                const teachers = await prisma.user.findMany({ 
                    where: { role: 'teacher', id: { not: teacherId } } 
                });
                candidates = teachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.name,
                    role,
                    department: teacher.department || undefined,
                    availability: {},
                    currentLoad: getCurrentLoad(teacher.id),
                    maxLoad: 6
                }));
                break;
        }

        // Evaluate each candidate for period matching scenarios
        const candidatesWithMatches = await Promise.all(candidates.map(async (candidate) => {
            candidatesEvaluated++;

            const dayAvail = candidate.availability[dayOfWeek] || [];
            const periodMatch = getPeriodMatch(periodsArray, dayAvail);
            
            if (periodMatch.matchType === 'none') {
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }

            const canCoverUncovered = periodMatch.canCover.filter(period => 
                !allAssignments[period] && isAvailable(candidate.id, period)
            );

            if (canCoverUncovered.length === 0) {
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }

            // Check qualification match - for now, always return true to debug
            const qualificationMatch = hasQualificationMatch(candidate, '');
            if (!qualificationMatch) {
                console.log(`❌ Qualification mismatch for ${candidate.name}: subjectSpecialties=${candidate.subjectSpecialties}, department=${candidate.department}, absentTeacherDepartment=${department}`);
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }

            let canActuallyCover = [];
            let currentDailyLoad = 0;
            
            if (candidate.role === 'external_substitute') {
                currentDailyLoad = await getDailyLoadForSubstitute(candidate.id, date);
            }
            
            for (const period of canCoverUncovered) {
                if (candidate.role === 'external_substitute' && currentDailyLoad >= 6) {
                    break;
                }
                
                if (await checkSpecialConstraints(candidate, period)) {
                    canActuallyCover.push(period);
                    if (candidate.role === 'external_substitute') {
                        currentDailyLoad++;
                    }
                }
            }

            // Calculate priority based on match type, coverage ability, and preferred teacher
            let priority = 0;
            if (periodMatch.matchType === 'perfect' && canActuallyCover.length === periodsArray.length) {
                priority = 100;
            } else if (periodMatch.matchType === 'perfect') {
                priority = 80;
            } else if (periodMatch.matchType === 'partial' && canActuallyCover.length > 0) {
                priority = 60;
            }

            // Boost priority for preferred teacher
            if (candidate.preferredTeacherId === teacherId) {
                priority += 50;
                console.log(`⭐ Preferred teacher match: ${candidate.name} prefers ${teacherId}`);
            }

            return { candidate, periodMatch, canActuallyCover, priority };
        }));

        candidatesWithMatches
            .filter(c => c.priority > 0 && c.canActuallyCover.length > 0)
            .sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return b.canActuallyCover.length - a.canActuallyCover.length;
            })
            .forEach(({ candidate, periodMatch, canActuallyCover }) => {
                for (const period of canActuallyCover) {
                    if (!allAssignments[period]) {
                        allAssignments[period] = {
                            candidate,
                            role,
                            reason: `${role.replace('_', ' ')} available for ${periodMatch.matchType} coverage (${canActuallyCover.length}/${periodsArray.length} periods)`
                        };
                    }
                }

                uncoveredPeriods = periodsArray.filter(period => !allAssignments[period]);
                
                if (uncoveredPeriods.length === 0) return;
            });
    }

    // Check if a single substitute covers all periods (perfect match)
    const allAssignedCandidates = Object.values(allAssignments).map(a => a?.candidate?.id).filter(Boolean);
    const uniqueCandidates = Array.from(new Set(allAssignedCandidates));
    const allAssignedRoles = Object.values(allAssignments).map(a => a?.role).filter(Boolean);
    const isPerfectSubMatch = uniqueCandidates.length === 1 && allAssignedRoles.every(r => r === 'external_substitute') && Object.keys(allAssignments).length === periodsArray.length;

    if (isPerfectSubMatch) {
        // One substitute covers all periods
        const candidate = allAssignments[periodsArray[0]].candidate;
        // Delete any existing assignment for this absence (test safety)
        await prisma.coverageAssignment.deleteMany({ where: { absenceId: absence.id } });
        const assignmentData = {
            absenceId: absence.id,
            status: 'assigned',
        };
        for (const period of periodsArray) {
            assignmentData[`period${period}`] = candidate.id;
            assignmentData[`period${period}Type`] = 'Substitute';
        }
        await prisma.coverageAssignment.create({ data: assignmentData });
        
        for (const period of periodsArray) {
            results.push({
                period,
                assigned: candidate.name,
                assignedRole: 'external_substitute',
                reason: 'Perfect match: substitute covers all periods',
                candidateEvaluated: candidatesEvaluated
            });
        }
        return results;
    }

    // Fallback: create assignments per period (legacy/partial)
    if (Object.keys(allAssignments).length !== periodsArray.length) {
        console.log('[CoverageAlgorithm] Entering fallback logic: not all periods assigned.');
        
        await prisma.coverageAssignment.deleteMany({ where: { absenceId: absence.id } });
        
        const assignmentData = {
            absenceId: absence.id,
            status: 'assigned',
        };
        
        for (const period of periodsArray) {
            const assignment = allAssignments[period];
            if (assignment) {
                assignmentData[`period${period}Type`] = assignment.role === 'external_substitute' ? 'Substitute' : 
                                                    assignment.role === 'paraprofessional' ? 'Paraprofessional' : 'Teacher';
                if (assignment.role === 'external_substitute') {
                    assignmentData[`period${period}`] = assignment.candidate.id;
                } else {
                    assignmentData[`period${period}`] = assignment.candidate.name;
                }
            }
            results.push({
                period,
                assigned: assignment?.candidate.name || null,
                assignedRole: assignment?.role || null,
                reason: assignment?.reason || 'No available staff after exhausting all role priorities',
                candidateEvaluated: candidatesEvaluated
            });
        }
        
        await prisma.coverageAssignment.create({ data: assignmentData });
        return results;
    }
    
    return results;
}
