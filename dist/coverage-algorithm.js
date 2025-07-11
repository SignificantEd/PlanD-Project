"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDayOfWeek = getDayOfWeek;
exports.assignCoverageForAbsence = assignCoverageForAbsence;
function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}
// Define role priority order as specified
const ROLE_PRIORITY = [
    'external_substitute',
    'paraprofessional',
    'internal_teacher'
];
/**
 * Enhanced PlanD Coverage Assignment Algorithm
 *
 * Given a specific ABSENCE_PERIOD, iteratively search for COVERING_STAFF by ROLE_PRIORITY:
 * 1. Preferred Sub → 2. External Sub → 3. Para → 4. Internal Teacher
 *
 * For each CANDIDATE_STAFF, check:
 * 1. AVAILABILITY for the ABSENCE_PERIOD
 * 2. QUALIFICATION_MATCH for the subject
 * 3. DAILY_LOAD_LIMITS
 * 4. SPECIAL_CONSTRAINTS
 *
 * The first CANDIDATE_STAFF that satisfies all criteria is assigned.
 * If no one is found after exhausting all ROLE_PRIORITY, flag as UNCOVERED.
 */
async function assignCoverageForAbsence(prisma, absence) {
    const date = absence.date;
    const teacherId = absence.teacherId;
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
    let department = absence.department;
    if (!department) {
        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        department = teacher?.department || undefined;
    }
    // Get periods needing coverage
    let periods = [];
    if (absence.periods) {
        // Handle both array and JSON string formats
        if (Array.isArray(absence.periods)) {
            periods = absence.periods.map(p => String(p)).filter(p => p && p !== 'null');
        }
        else if (typeof absence.periods === 'string') {
            try {
                const parsed = JSON.parse(absence.periods);
                if (Array.isArray(parsed)) {
                    periods = parsed.map(p => String(p)).filter(p => p && p !== 'null');
                }
            }
            catch (error) {
                console.log('Failed to parse periods JSON, falling back to master schedule');
            }
        }
    }
    if (!periods.length) {
        // Fallback: get periods from master schedule
        const msEntries = await prisma.masterSchedule.findMany({
            where: { teacherId, dayOfWeek, isTeaching: true }
        });
        periods = msEntries.map(ms => ms.period);
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
        const teaching = masterSchedule.find(ms => ms.teacherId === staffId && ms.period === period && ms.isTeaching);
        if (teaching)
            return false;
        // Check if already covering
        const covering = coverageAssignments.find(ca => ca[`period${period}`] === staffId);
        if (covering)
            return false;
        // Check if absent
        if (absentIds.has(staffId))
            return false;
        return true;
    }
    // Helper: Check period availability match between absent teacher and candidate
    function getPeriodMatch(neededPeriods, availablePeriods) {
        const canCover = neededPeriods.filter(period => availablePeriods.includes(period));
        const cannotCover = neededPeriods.filter(period => !availablePeriods.includes(period));
        let matchType;
        if (canCover.length === 0) {
            matchType = 'none';
        }
        else if (canCover.length === neededPeriods.length) {
            matchType = 'perfect';
        }
        else {
            matchType = 'partial';
        }
        return { canCover, cannotCover, matchType };
    }
    // Helper: Get current load for a staff member
    function getCurrentLoad(staffId) {
        let load = 0;
        // Count teaching periods
        for (const ms of masterSchedule) {
            if (ms.teacherId === staffId && ms.isTeaching)
                load++;
        }
        // Count coverage assignments
        for (const ca of coverageAssignments) {
            if (Object.values(ca).includes(staffId))
                load++;
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
        if (candidate.currentLoad >= candidate.maxLoad)
            return false;
        // Check if this would exceed consecutive periods limit
        const consecutivePeriods = await getConsecutivePeriods(candidate.id, dayOfWeek, period);
        if (consecutivePeriods > 4)
            return false; // Max 4 consecutive periods
        // Check substitute daily limit (6 periods per day)
        if (candidate.role === 'external_substitute') {
            const currentDailyLoad = await getDailyLoadForSubstitute(candidate.id, date);
            if (currentDailyLoad >= 6)
                return false; // Substitutes limited to 6 periods per day
        }
        // TODO: Add more constraint checks (room conflicts, do-not-assign lists, etc.)
        return true;
    }
    // Helper: Get daily load for a substitute (including existing assignments)
    async function getDailyLoadForSubstitute(substituteId, date) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        // Count existing coverage assignments for this substitute on this date
        const existingAssignments = await prisma.coverageAssignment.findMany({
            where: {
                absence: {
                    date: new Date(dateStr)
                }
            }
        });
        let dailyLoad = 0;
        // Count periods where this substitute is already assigned
        for (const assignment of existingAssignments) {
            for (const period of ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']) {
                if (assignment[`period${period}`] === substituteId) {
                    dailyLoad++;
                }
            }
        }
        return dailyLoad;
    }
    // Helper: Get consecutive periods
    async function getConsecutivePeriods(staffId, dayOfWeek, newPeriod) {
        const periodOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
        const newPeriodIndex = periodOrder.indexOf(newPeriod);
        let consecutive = 1;
        // Check backwards
        for (let i = newPeriodIndex - 1; i >= 0; i--) {
            const period = periodOrder[i];
            const isBusy = masterSchedule.some(ms => ms.teacherId === staffId && ms.period === period && ms.isTeaching) || coverageAssignments.some(ca => ca[`period${period}`] === staffId);
            if (isBusy)
                consecutive++;
            else
                break;
        }
        // Check forwards
        for (let i = newPeriodIndex + 1; i < periodOrder.length; i++) {
            const period = periodOrder[i];
            const isBusy = masterSchedule.some(ms => ms.teacherId === staffId && ms.period === period && ms.isTeaching) || coverageAssignments.some(ca => ca[`period${period}`] === staffId);
            if (isBusy)
                consecutive++;
            else
                break;
        }
        return consecutive;
    }
    // Process all periods together to handle the three scenarios
    let allAssignments = {};
    let uncoveredPeriods = [...periods]; // Start with all periods uncovered
    let candidatesEvaluated = 0;
    // Iterate through role priorities
    for (const role of ROLE_PRIORITY) {
        if (uncoveredPeriods.length === 0)
            break; // All periods covered
        let candidates = [];
        // Get candidates for this role
        switch (role) {
            case 'external_substitute':
                // Get all substitutes
                const allSubs = await prisma.substitute.findMany();
                candidates = await Promise.all(allSubs.map(async (sub) => {
                    const availability = typeof sub.availability === 'string'
                        ? JSON.parse(sub.availability)
                        : sub.availability;
                    const currentLoad = getCurrentLoad(sub.id);
                    const maxLoad = sub.loadLimitConfigId
                        ? (await prisma.loadLimitConfig.findUnique({ where: { id: sub.loadLimitConfigId } }))?.maxPeriodsPerDay || 6
                        : 6;
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
                        preferredTeacherId: undefined // Temporarily disabled
                    };
                }));
                break;
            case 'paraprofessional':
                // Get paraprofessionals
                const parapros = await prisma.user.findMany({
                    where: { role: 'paraprofessional' }
                });
                candidates = parapros.map(para => ({
                    id: para.id,
                    name: para.name,
                    role,
                    department: para.department || undefined,
                    availability: {}, // TODO: Get parapro availability
                    currentLoad: getCurrentLoad(para.id),
                    maxLoad: 6 // Default max load for parapros
                }));
                break;
            case 'internal_teacher':
                // Get internal teachers (excluding absent one)
                const teachers = await prisma.user.findMany({
                    where: { role: 'teacher', id: { not: teacherId } }
                });
                candidates = teachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.name,
                    role,
                    department: teacher.department || undefined,
                    availability: {}, // TODO: Get teacher availability
                    currentLoad: getCurrentLoad(teacher.id),
                    maxLoad: 6 // Default max load for teachers
                }));
                break;
        }
        // Evaluate each candidate for period matching scenarios
        // Sort candidates to prioritize perfect matches (scenario #1)
        const candidatesWithMatches = await Promise.all(candidates.map(async (candidate) => {
            candidatesEvaluated++;
            // Get candidate's availability for the day
            const dayAvail = candidate.availability[dayOfWeek] || [];
            // Check period match scenarios
            const periodMatch = getPeriodMatch(periods, dayAvail);
            if (periodMatch.matchType === 'none') {
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }
            // Check if candidate can cover any of the uncovered periods
            const canCoverUncovered = periodMatch.canCover.filter(period => !allAssignments[period] && isAvailable(candidate.id, period));
            if (canCoverUncovered.length === 0) {
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }
            // Check qualification match for the subject
            if (!hasQualificationMatch(candidate, '')) { // TODO: Get actual subject
                return { candidate, periodMatch, canActuallyCover: [], priority: 0 };
            }
            // Check load limits and constraints for all periods they can cover
            let canActuallyCover = [];
            let currentDailyLoad = 0;
            // For substitutes, get their current daily load
            if (candidate.role === 'external_substitute') {
                currentDailyLoad = await getDailyLoadForSubstitute(candidate.id, date);
            }
            for (const period of canCoverUncovered) {
                // Check if adding this period would exceed daily limits
                if (candidate.role === 'external_substitute' && currentDailyLoad >= 6) {
                    break; // Substitute has reached daily limit
                }
                if (await checkSpecialConstraints(candidate, period)) {
                    canActuallyCover.push(period);
                    if (candidate.role === 'external_substitute') {
                        currentDailyLoad++; // Increment daily load for substitutes
                    }
                }
            }
            // Calculate priority based on match type and coverage ability
            let priority = 0;
            if (periodMatch.matchType === 'perfect' && canActuallyCover.length === periods.length) {
                priority = 100; // Highest priority for perfect match covering all periods
            }
            else if (periodMatch.matchType === 'perfect') {
                priority = 80; // High priority for perfect match covering some periods
            }
            else if (periodMatch.matchType === 'partial' && canActuallyCover.length > 0) {
                priority = 60; // Medium priority for partial match
            }
            return { candidate, periodMatch, canActuallyCover, priority };
        }));
        // Sort candidates by priority (highest first) and then by coverage amount
        candidatesWithMatches
            .filter(c => c.priority > 0 && c.canActuallyCover.length > 0)
            .sort((a, b) => {
            // First sort by priority
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            // Then sort by number of periods they can cover
            return b.canActuallyCover.length - a.canActuallyCover.length;
        })
            .forEach(({ candidate, periodMatch, canActuallyCover }) => {
            // Assign this candidate to the periods they can cover
            for (const period of canActuallyCover) {
                if (!allAssignments[period]) { // Double-check no one else was assigned
                    allAssignments[period] = {
                        candidate,
                        role,
                        reason: `${role.replace('_', ' ')} available for ${periodMatch.matchType} coverage (${canActuallyCover.length}/${periods.length} periods)`
                    };
                }
            }
            // Update uncovered periods
            uncoveredPeriods = periods.filter(period => !allAssignments[period]);
            // If all periods are covered, we can stop
            if (uncoveredPeriods.length === 0)
                return;
        });
    }
    // Create assignments in database and build results
    // Check if a single substitute covers all periods (perfect match)
    const allAssignedCandidates = Object.values(allAssignments).map(a => a?.candidate?.id).filter(Boolean);
    const uniqueCandidates = Array.from(new Set(allAssignedCandidates));
    const allAssignedRoles = Object.values(allAssignments).map(a => a?.role).filter(Boolean);
    const isPerfectSubMatch = uniqueCandidates.length === 1 && allAssignedRoles.every(r => r === 'external_substitute') && Object.keys(allAssignments).length === periods.length;
    if (isPerfectSubMatch) {
        // One substitute covers all periods
        const candidate = allAssignments[periods[0]].candidate;
        // Delete any existing assignment for this absence (test safety)
        await prisma.coverageAssignment.deleteMany({ where: { absenceId: absence.id } });
        const assignmentData = {
            absenceId: absence.id,
            status: 'assigned',
        };
        for (const period of periods) {
            assignmentData[`period${period}`] = candidate.id;
            assignmentData[`period${period}Type`] = 'Substitute';
        }
        await prisma.coverageAssignment.create({ data: assignmentData });
        // Build results
        for (const period of periods) {
            results.push({
                period,
                assigned: candidate.name,
                assignedRole: 'external_substitute',
                reason: 'Perfect match: substitute covers all periods',
                candidateEvaluated: candidatesEvaluated
            });
        }
        return results; // <--- Ensure immediate return here
    }
    // Fallback: create assignments per period (legacy/partial)
    // (This block will not run if perfect match was found)
    if (Object.keys(allAssignments).length !== periods.length) {
        console.log('[CoverageAlgorithm] Entering fallback logic: not all periods assigned.');
        // Delete any existing assignment for this absence (test safety)
        await prisma.coverageAssignment.deleteMany({ where: { absenceId: absence.id } });
        // Create a single CoverageAssignment record with all assigned periods
        const assignmentData = {
            absenceId: absence.id,
            status: 'assigned',
        };
        for (const period of periods) {
            const assignment = allAssignments[period];
            if (assignment) {
                assignmentData[`period${period}Type`] = assignment.role === 'external_substitute' ? 'Substitute' :
                    assignment.role === 'paraprofessional' ? 'Paraprofessional' : 'Teacher';
                if (assignment.role === 'external_substitute') {
                    assignmentData[`period${period}`] = assignment.candidate.id;
                }
                else {
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
        // Create single record for all assignments
        await prisma.coverageAssignment.create({ data: assignmentData });
        return results;
    }
    // If all periods are assigned, do not run fallback
    return results;
}
