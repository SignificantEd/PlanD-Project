import { PrismaClient } from '@prisma/client';
import {
  ITeacher,
  ISubstitute,
  IAbsence,
  ISettings,
  IAssignment,
  ICoverageResult,
  ICandidateStaff
} from '../types/interfaces';

// Import notification service
import { notificationService, CoverageNotificationData } from './notification-service';

/**
 * Enterprise-Grade PlanD Coverage Assignment Algorithm
 *
 * This algorithm implements a sophisticated priority-based system for assigning
 * coverage to teacher absences with multiple phases and comprehensive constraints.
 */

// Role priority order as specified - PARAPROFESSIONALS HAVE HIGHEST PRIORITY
const ROLE_PRIORITY = [
  'paraprofessional',
  'external_substitute', 
  'internal_teacher'
] as const;

type RolePriority = typeof ROLE_PRIORITY[number];

interface AssignmentContext {
  date: string;
  dayType: 'A' | 'B';
  settings: ISettings;
  teachers: ITeacher[];
  substitutes: ISubstitute[];
  absences: IAbsence[];
  existingAssignments: IAssignment[];
  masterSchedule: any[];
}

interface AssignmentResult {
  assignments: IAssignment[];
  coverageResults: ICoverageResult[];
  totalCandidatesEvaluated: number;
  processingTime: number;
  notificationData?: CoverageNotificationData;
}

/**
 * Main coverage assignment function for enterprise system
 */
export async function assignCoverageForDate(
  prisma: PrismaClient,
  date: string,
  dayType: 'A' | 'B'
): Promise<AssignmentResult> {
  console.log('\n--- Starting Coverage Assignment Process ---');
  console.log(`Date: ${date}, Day Type: ${dayType}`);
  const startTime = Date.now();

  // Get all required data
  const context = await buildAssignmentContext(prisma, date);
  console.log('Assignment Context Built:');
  console.log(`  Absences found: ${context.absences.length}`);
  console.log(`  Substitutes fetched: ${context.substitutes.length}`);
  console.log(`  Teachers fetched: ${context.teachers.length}`);
  console.log('  Absences details:', context.absences.map(a => ({ id: a.id, teacherId: a.teacherId, date: a.date, periods: a.periods })));
  
  // Check for preferred substitutes who should be automatically pulled from master schedule
  console.log('🎯 Checking for preferred substitutes to pull from master schedule...');
  await handlePreferredSubstitutePull(prisma, date, context.absences);

  // Reset daily coverage counts for fair distribution
  resetDailyCoverageCounts(context);

  // Sort absences by priority
  const sortedAbsences = sortAbsencesByPriority(context.absences);

  console.log('\n--- Processing Absences in Priority Order ---');
  console.log('Sorted Absences:', sortedAbsences.map(a => ({ id: a.id, teacherId: a.teacherId, priority: a.priority, periods: a.periods.length })));

  const allAssignments: IAssignment[] = [];
  const allCoverageResults: ICoverageResult[] = [];
  let totalCandidatesEvaluated = 0;

  // Process each absence in priority order
  for (const absence of sortedAbsences) {
    console.log(`\nProcessing Absence for Teacher: ${absence.absentTeacherName || absence.teacherId} on ${absence.date} (Periods: ${absence.periods.join(', ')})`);
    console.log('  Attempting to process each period for this absence...');
    const { assignments, coverageResults, candidatesEvaluated } =
      await processAbsence(prisma, context, absence, allAssignments);

    allAssignments.push(...assignments);
    allCoverageResults.push(...coverageResults);
    totalCandidatesEvaluated += candidatesEvaluated;

    // Update context with new assignments
    context.existingAssignments.push(...assignments);
  }

  // Save assignments to database
  await saveAssignmentsToDatabase(prisma, allAssignments);

  const processingTime = Date.now() - startTime;

  console.log('\n--- Coverage Assignment Process Completed ---');
  console.log('Final Assignments Count:', allAssignments.length);
  console.log('Final Assignments Details:', allAssignments.map(a => ({ id: a.id, absentTeacher: a.absentTeacherName, assignedTo: a.assignedToName, period: a.period, type: a.assignmentType })));
  console.log('Total Coverage Results:', allCoverageResults.length);
  console.log('Total Candidates Evaluated:', totalCandidatesEvaluated);
  console.log('Processing Time:', processingTime, 'ms');

  // Prepare notification data
  const notificationData: CoverageNotificationData = {
    absenceId: context.absences.length > 0 ? context.absences[0].id : '',
    assignments: allAssignments.map(assignment => ({
      id: assignment.id,
      period: assignment.period,
      assignedToId: assignment.assignedToId,
      assignedToType: assignment.assignmentType as 'Substitute' | 'Teacher' | 'Paraprofessional',
      subject: 'TBD', // This would need to be looked up from master schedule
      room: 'TBD', // This would need to be looked up from master schedule
      isEmergency: assignment.notes?.includes('emergency') || assignment.notes?.includes('override') || false,
      notes: assignment.notes || ''
    })),
    uncoveredPeriods: [], // This would be populated from unassigned periods
    constraintViolations: [], // This would be populated from constraint checks
    emergencyOverrides: [] // This would be populated from emergency assignments
  };

  // Send notifications asynchronously (don't wait for completion)
  if (allAssignments.length > 0 || notificationData.uncoveredPeriods.length > 0) {
    notificationService.sendCoverageNotifications(notificationData).catch(error => {
      console.error('❌ Failed to send notifications:', error);
    });
  }

  return {
    assignments: allAssignments,
    coverageResults: allCoverageResults,
    totalCandidatesEvaluated,
    processingTime,
    notificationData
  };
}

/**
 * Build comprehensive context for assignment processing
 */
async function buildAssignmentContext(
  prisma: PrismaClient,
  date: string
): Promise<AssignmentContext> {
  // Get settings
  const school = await prisma.school.findFirst();
  const settings = school?.settings as unknown as ISettings || getDefaultSettings();

  // Get all teachers
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' }
  });

  // Get all substitutes
  const substitutes = await prisma.substitute.findMany();

  // Fetch absences for the date
  const absences = await prisma.absence.findMany({
    where: {
      date: {
        gte: new Date(date + 'T00:00:00'),
        lt: new Date(date + 'T23:59:59')
      },
      status: { in: ['pending', 'Pending'] }
    },
    include: {
      teacher: true,
      school: true,
      coverageAssignments: true
    }
  });

  // Get existing assignments for the date
  const existingAssignments = await prisma.coverageAssignment.findMany({
    where: {
      absence: {
        date: new Date(date)
      }
    }
  });

  // Get master schedule
  const masterSchedule = await prisma.masterSchedule.findMany({
    where: { dayOfWeek: getDayOfWeek(new Date(date)) }
  });

  return {
    date,
    dayType: 'A' as 'A' | 'B', // Default to 'A' for one-day cycle
    settings,
    teachers: teachers.map(convertToITeacher),
    substitutes: substitutes.map(convertToISubstitute),
    absences: absences.map(absence => convertToIAbsence(absence, teachers, masterSchedule)),
    existingAssignments: existingAssignments.map(convertToIAssignment),
    masterSchedule
  };
}

/**
 * Sort absences by priority (Para > Full Day > Half Day > Custom)
 */
function sortAbsencesByPriority(absences: IAbsence[]): IAbsence[] {
  console.log('\n🎯 SORTING ABSENCES BY PRIORITY (PARAPROFESSIONALS FIRST):');
  absences.forEach(a => {
    console.log(`  ${a.absentTeacherName}: Priority ${a.priority} (${a.periods.length} periods)`);
  });
  
  const sorted = absences.sort((a, b) => {
    // First by priority number (lower = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // Then by number of periods (more periods = higher priority)
    if (a.periods.length !== b.periods.length) {
      return b.periods.length - a.periods.length;
    }

    // Finally alphabetically by teacher name
    return a.absentTeacherName.localeCompare(b.absentTeacherName);
  });
  
  console.log('\n📋 FINAL PROCESSING ORDER:');
  sorted.forEach((a, index) => {
    const priorityLabel = a.priority === 1 ? '⭐ PARAPROFESSIONAL' : a.priority === 2 ? '📚 FULL-DAY' : '📖 REGULAR';
    console.log(`  ${index + 1}. ${a.absentTeacherName} (${priorityLabel})`);
  });
  
  return sorted;
}

/**
 * Process a single absence through all assignment phases
 */
async function processAbsence(
  prisma: PrismaClient,
  context: AssignmentContext,
  absence: IAbsence,
  existingNewAssignments: IAssignment[] = []
): Promise<{ assignments: IAssignment[]; coverageResults: ICoverageResult[]; candidatesEvaluated: number }> {
  const assignments: IAssignment[] = [];
  const coverageResults: ICoverageResult[] = [];
  let candidatesEvaluated = 0;

  console.log(`Processing Absence for Teacher: ${absence.absentTeacherName} on ${absence.date} (Periods: ${absence.periods.join(', ')})`);

  // Check if this is a full-day absence (using Front Office threshold)
  if (absence.periods.length >= context.settings.fullDayThreshold) {
    console.log(`  Full-day absence detected (${absence.periods.length} periods). Attempting to find one substitute for all periods...`);
    
    // Try to find one substitute available for ALL periods
    const fullDayResult = await findFullDaySubstituteCoverage(context, absence, existingNewAssignments);
    candidatesEvaluated += fullDayResult.candidatesEvaluated;
    
    if (fullDayResult.substitute) {
      console.log(`  ✅ Found full-day substitute: ${fullDayResult.substitute.name}`);
      
      // Assign the same substitute to all periods
      for (const period of absence.periods) {
        const assignment: IAssignment = {
          id: generateId(),
          absenceId: absence.id,
          absentTeacherId: absence.teacherId,
          absentTeacherName: absence.absentTeacherName,
          period,
          assignedToId: fullDayResult.substitute.id,
          assignedToName: fullDayResult.substitute.name,
          assignmentType: 'External Sub',
          date: context.date,
          status: 'assigned', // Needs approval
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        assignments.push(assignment);
        
        const coverageResult: ICoverageResult = {
          period,
          assigned: fullDayResult.substitute.name,
          assignedRole: 'external_substitute',
          reason: `Full-day substitute assigned (${fullDayResult.substitute.assignedCoverageCount}/${fullDayResult.substitute.maxDailyLoad} periods)`,
          candidateEvaluated: candidatesEvaluated,
          assignmentType: 'External Sub',
          status: 'assigned' // Needs approval
        };
        
        coverageResults.push(coverageResult);
      }
      
      // Update absence status based on coverage results
      await updateAbsenceStatus(prisma, absence, coverageResults);
      
      return { assignments, coverageResults, candidatesEvaluated };
    }
    
    console.log(`  ❌ No substitute available for full-day coverage. Falling back to period-by-period assignment...`);
  }

  // Process each period individually (for non-full-day absences or when full-day coverage unavailable)
  console.log(`  Attempting to process each period for this absence...`);
  for (const period of absence.periods) {
    const { assignment, coverageResult, candidatesEvaluated: periodCandidates } =
      await assignCoverageForPeriod(prisma, context, absence, period, [...existingNewAssignments, ...assignments]);

    if (assignment) {
      assignments.push(assignment);
    }

    coverageResults.push(coverageResult);
    candidatesEvaluated += periodCandidates;
  }

  // Update absence status based on coverage results
  await updateAbsenceStatus(prisma, absence, coverageResults);

  return { assignments, coverageResults, candidatesEvaluated };
}

/**
 * Assign coverage for a specific period using the 5-phase algorithm
 */
async function assignCoverageForPeriod(
  prisma: PrismaClient,
  context: AssignmentContext,
  absence: IAbsence,
  period: string,
  existingNewAssignments: IAssignment[] = []
): Promise<{ assignment?: IAssignment; coverageResult: ICoverageResult; candidatesEvaluated: number }> {
  let candidatesEvaluated = 0;

  // Phase 1: Manual Override (Highest Priority)
  if (absence.manualOverride[period]) {
    const manualAssignment = await createManualOverrideAssignment(
      prisma, context, absence, period, absence.manualOverride[period]
    );

    return {
      assignment: manualAssignment,
      coverageResult: {
        period,
        assigned: manualAssignment.assignedToName,
        assignedRole: 'external_substitute', // Assume manual overrides are subs
        reason: 'Manual override assignment',
        candidateEvaluated: 1,
        assignmentType: 'Manual Override',
        status: 'assigned'
      },
      candidatesEvaluated: 1
    };
  }

  // Phase 2: External Substitutes
  const substituteResult = await findSubstituteCoverage(context, absence, period, existingNewAssignments);
  candidatesEvaluated += substituteResult.candidatesEvaluated;

  if (substituteResult.assignment) {
    return {
      assignment: substituteResult.assignment,
      coverageResult: {
        period,
        assigned: substituteResult.assignment.assignedToName,
        assignedRole: 'external_substitute',
        reason: substituteResult.reason,
        candidateEvaluated: candidatesEvaluated,
        assignmentType: 'External Sub',
        status: 'assigned'
      },
      candidatesEvaluated
    };
  }

  // Phase 3: Internal Teachers (Normal Coverage)
  const normalTeacherResult = await findInternalTeacherCoverage(
    context, absence, period, context.settings.maxInternalCoverageNormal, existingNewAssignments
  );
  candidatesEvaluated += normalTeacherResult.candidatesEvaluated;

  if (normalTeacherResult.assignment) {
    return {
      assignment: normalTeacherResult.assignment,
      coverageResult: {
        period,
        assigned: normalTeacherResult.assignment.assignedToName,
        assignedRole: 'internal_teacher',
        reason: normalTeacherResult.reason,
        candidateEvaluated: candidatesEvaluated,
        assignmentType: 'Internal Coverage',
        status: 'assigned'
      },
      candidatesEvaluated
    };
  }

  // Phase 4: Internal Teachers (Emergency Coverage)
  const emergencyTeacherResult = await findInternalTeacherCoverage(
    context, absence, period, context.settings.maxInternalCoverageEmergency, existingNewAssignments
  );
  candidatesEvaluated += emergencyTeacherResult.candidatesEvaluated;

  if (emergencyTeacherResult.assignment) {
    return {
      assignment: emergencyTeacherResult.assignment,
      coverageResult: {
        period,
        assigned: emergencyTeacherResult.assignment.assignedToName,
        assignedRole: 'internal_teacher',
        reason: emergencyTeacherResult.reason,
        candidateEvaluated: candidatesEvaluated,
        assignmentType: 'Emergency Coverage',
        status: 'assigned'
      },
      candidatesEvaluated
    };
  }

  // Phase 5: No Coverage Available
  const noCoverageAssignment = await createNoCoverageAssignment(prisma, context, absence, period);

  return {
    assignment: noCoverageAssignment,
    coverageResult: {
      period,
      assigned: null,
      assignedRole: null,
      reason: 'No available staff after exhausting all role priorities',
      candidateEvaluated: candidatesEvaluated,
      assignmentType: 'No Coverage',
      status: 'assigned'
    },
    candidatesEvaluated
  };
}

/**
 * Find substitute coverage for a full-day absence (5+ periods)
 * Priority: 1) Preferred substitute 2) Subject specialty match 3) Lowest workload
 */
async function findFullDaySubstituteCoverage(
  context: AssignmentContext,
  absence: IAbsence,
  existingNewAssignments: IAssignment[] = []
): Promise<{ substitute?: ISubstitute; reason: string; candidatesEvaluated: number }> {
  let candidatesEvaluated = 0;
  console.log(`\n    [Full-Day Search] Looking for substitute to cover ALL ${absence.periods.length} periods`);
  console.log(`    [Full-Day Search] Periods needed: ${absence.periods.join(', ')}`);

  // Filter substitutes available for ALL periods
  const availableForAllPeriods = context.substitutes.filter(sub => {
    candidatesEvaluated++;
    console.log(`      [Checking] ${sub.name} for full-day coverage...`);
    
    // Check if substitute is available for ALL periods
    const isAvailableForAllPeriods = absence.periods.every(period => {
      const hasAvailability = sub.availability && Object.values(sub.availability).some(periods => 
        Array.isArray(periods) && periods.includes(period)
      );
      console.log(`        Period ${period}: ${hasAvailability ? 'Available' : 'Not Available'}`);
      return hasAvailability;
    });
    
    console.log(`        Overall availability for all periods: ${isAvailableForAllPeriods}`);
    
    if (!isAvailableForAllPeriods) {
      console.log(`        ❌ Not available for all required periods`);
      return false;
    }
    
    // CRITICAL FIX: For full-day assignments, allow exceeding normal maxDailyLoad
    // but still respect absolute maximum (e.g., 8 periods max per day)
    const totalPeriodsNeeded = absence.periods.length;
    const absoluteMaxPeriodsPerDay = 8; // Hard limit - no one works more than 8 periods
    
    if (sub.assignedCoverageCount + totalPeriodsNeeded > absoluteMaxPeriodsPerDay) {
      console.log(`        ❌ Would exceed absolute max daily load (${sub.assignedCoverageCount + totalPeriodsNeeded}/${absoluteMaxPeriodsPerDay})`);
      return false;
    }
    
    // CRITICAL: Check for assignment conflicts using new conflict detection
    const hasConflicts = absence.periods.some(period => 
      hasAssignmentConflict(sub.id, period, context, existingNewAssignments)
    );
    
    if (hasConflicts) {
      console.log(`        ❌ Has assignment conflicts for one or more periods`);
      return false;
    }
    
    // CRITICAL FIX: For full-day assignments, allow exceeding normal maxPeriodsPerPerson
    // but check against absolute maximum
    if (wouldExceedAbsoluteMaxPeriods(sub.id, totalPeriodsNeeded, context, existingNewAssignments)) {
      console.log(`        ❌ Would exceed absolute max periods per day`);
      return false;
    }
    
    // CRITICAL: For full-day assignments, consecutive periods are expected and allowed
    // Skip consecutive period check for full-day assignments
    console.log(`        ✅ Full-day assignment - allowing consecutive periods`);
    
    // Check if substitute is absent
    const isAbsent = context.absences.some(a => a.teacherId === sub.id);
    if (isAbsent) {
      console.log(`        ❌ Currently absent`);
      return false;
    }
    
    console.log(`        ✅ Available for all ${totalPeriodsNeeded} periods (full-day assignment)`);
    return true;
  });

  console.log(`    [Full-Day Search] Found ${availableForAllPeriods.length} substitutes available for all periods`);
  
  if (availableForAllPeriods.length === 0) {
    return { reason: 'No substitutes available for all required periods', candidatesEvaluated };
  }

  // Priority 1: Check for preferred substitute first
  const preferredSubs = availableForAllPeriods.filter(sub => 
    sub.preferredTeacherId === absence.teacherId
  );
  
  if (preferredSubs.length > 0) {
    // Among preferred subs, choose the one with lowest workload
    const selectedPreferredSub = preferredSubs.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
    selectedPreferredSub.assignedCoverageCount += absence.periods.length;
    console.log(`    [Full-Day Search] ✅ Selected PREFERRED substitute: ${selectedPreferredSub.name} (preferred for ${absence.absentTeacherName})`);
    
    const reason = `Preferred full-day substitute for ${absence.absentTeacherName} (${selectedPreferredSub.assignedCoverageCount}/${selectedPreferredSub.maxDailyLoad} periods)`;
    return { substitute: selectedPreferredSub, reason, candidatesEvaluated };
  }
  
  // Priority 2: Subject specialty match
  const qualifiedSubs = availableForAllPeriods.filter(sub => 
    hasQualificationMatch(sub, absence.teacherId, context)
  );
  
  let selectedSub;
  if (qualifiedSubs.length > 0) {
    // Among qualified subs, prefer lowest workload
    selectedSub = qualifiedSubs.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
    console.log(`    [Full-Day Search] ✅ Selected QUALIFIED substitute: ${selectedSub.name}`);
  } else {
    // Priority 3: No qualified match, use lowest workload
    selectedSub = availableForAllPeriods.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
    console.log(`    [Full-Day Search] ✅ Selected AVAILABLE substitute: ${selectedSub.name} (no specialty match)`);
  }

  // Update substitute's coverage count for all periods
  selectedSub.assignedCoverageCount += absence.periods.length;
  console.log(`    [Full-Day Search] Updated ${selectedSub.name} workload: ${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods`);

  const reason = qualifiedSubs.length > 0
    ? `Qualified full-day substitute (${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods)`
    : `Available full-day substitute (${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods)`;

  return { substitute: selectedSub, reason, candidatesEvaluated };
}

/**
 * Find substitute coverage for a period
 */
async function findSubstituteCoverage(
  context: AssignmentContext,
  absence: IAbsence,
  period: string,
  existingNewAssignments: IAssignment[] = []
): Promise<{ assignment?: IAssignment; reason: string; candidatesEvaluated: number }> {
  let candidatesEvaluated = 0;
  console.log(`\n  [Sub Coverage] Attempting to find substitute for absence ${absence.id}, period ${period}`);
  console.log(`  [Sub Coverage] Total available substitutes: ${context.substitutes.length}`);

  // Filter available substitutes
  const availableSubs = context.substitutes.filter(sub => {
    candidatesEvaluated++;
    
    // For one-day cycle MVP, check if substitute has any availability
    const hasAvailability = sub.availability && Object.values(sub.availability).some(periods => 
      Array.isArray(periods) && periods.includes(period)
    );
    
    const isAvailable = hasAvailability;
    console.log(`    [Sub Check] Evaluating sub ${sub.name || sub.id} for period ${period}. Available: ${isAvailable ? 'YES' : 'NO'}`);
    
    if (!isAvailable) {
      console.log('      Reason: Sub not available for this period.');
      return false;
    }
    // CRITICAL: Check for assignment conflicts
    if (hasAssignmentConflict(sub.id, period, context, existingNewAssignments)) {
      console.log('      Reason: Sub has assignment conflict for this period.');
      return false;
    }
    
    // CRITICAL: Check if would exceed max periods per day
    if (wouldExceedMaxPeriods(sub.id, 1, context, existingNewAssignments)) {
      console.log('      Reason: Sub would exceed max periods per day.');
      return false;
    }
    
    if (sub.assignedCoverageCount >= sub.maxDailyLoad) {
      console.log('      Reason: Sub already at max daily load.');
      return false;
    }
    const isAbsent = context.absences.some(a => a.teacherId === sub.id);
    if (isAbsent) {
      console.log('      Reason: Sub is currently absent.');
      return false;
    }
    return true;
  });

  console.log(`  [Sub Coverage] Filtered available subs: ${availableSubs.length}`);
  if (availableSubs.length === 0) {
    console.log('  [Sub Coverage] No available substitutes after filtering.');
    return { reason: 'No available substitutes', candidatesEvaluated };
  }

  // First, check for preferred substitute
  const preferredSubs = availableSubs.filter(sub => sub.preferredTeacherId === absence.teacherId);
  let selectedSub;
  let selectionReason = '';
  
  if (preferredSubs.length > 0) {
    // Prefer lower workload among preferred subs
    selectedSub = preferredSubs.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
    selectionReason = 'preferred';
    console.log(`  [Sub Coverage] Selected PREFERRED substitute: ${selectedSub.name} (preferred for ${absence.absentTeacherName})`);
  } else {
    // Second, try to find a qualified substitute (specialty match)
    const qualifiedSubs = availableSubs.filter(sub => hasQualificationMatch(sub, absence.teacherId, context));
    if (qualifiedSubs.length > 0) {
      // Prefer lower workload among qualified
      selectedSub = qualifiedSubs.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
      selectionReason = 'qualified';
      console.log('  [Sub Coverage] Selected qualified substitute:', selectedSub.name || selectedSub.id);
    } else {
      // No qualified, fallback to any available
      selectedSub = availableSubs.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount)[0];
      selectionReason = 'available';
      console.log('  [Sub Coverage] No qualified substitute found, selected available substitute:', selectedSub.name || selectedSub.id);
    }
  }

  // Create assignment
  const assignment: IAssignment = {
    id: generateId(),
    absenceId: absence.id,
    absentTeacherId: absence.teacherId,
    absentTeacherName: absence.absentTeacherName,
    period,
    assignedToId: selectedSub.id,
    assignedToName: selectedSub.name,
    assignmentType: 'External Sub',
    date: context.date,
    status: 'assigned',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Update substitute's coverage count
  selectedSub.assignedCoverageCount++;
  console.log('  [Sub Coverage] Substitute assignment created:', assignment.id);

  const reason = selectionReason === 'preferred'
    ? `Preferred substitute for ${absence.absentTeacherName} (${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods)`
    : selectionReason === 'qualified'
    ? `Qualified substitute available (${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods)`
    : `Available substitute assigned (${selectedSub.assignedCoverageCount}/${selectedSub.maxDailyLoad} periods)`;

  return { assignment, reason, candidatesEvaluated };
}

/**
 * Find internal teacher coverage for a period
 */
async function findInternalTeacherCoverage(
  context: AssignmentContext,
  absence: IAbsence,
  period: string,
  maxLoad: number,
  existingNewAssignments: IAssignment[] = []
): Promise<{ assignment?: IAssignment; reason: string; candidatesEvaluated: number }> {
  let candidatesEvaluated = 0;
  console.log(`\n  [Teacher Coverage] Attempting to find internal teacher for absence ${absence.id}, period ${period} (Max Load: ${maxLoad}).`);
  console.log(`  [Teacher Coverage] Total available teachers: ${context.teachers.length}`);

  // Filter available teachers
  const availableTeachers = context.teachers.filter(teacher => {
    candidatesEvaluated++;
    console.log(`    [Teacher Check] Evaluating teacher ${teacher.name || teacher.id} for period ${period}.`);
    if (teacher.id === absence.teacherId) {
      console.log('      Reason: Teacher is the absent teacher.');
      return false;
    }
    // For one-day cycle MVP, just check if teacher is free this period
    // TODO: Implement proper schedule checking
    const isFree = true; // Placeholder - need to check master schedule
    if (!isFree) {
      console.log('      Reason: Teacher not in a non-teaching period.');
      return false;
    }
    // CRITICAL: Check for assignment conflicts
    if (hasAssignmentConflict(teacher.id, period, context, existingNewAssignments)) {
      console.log('      Reason: Teacher has assignment conflict for this period.');
      return false;
    }
    
    // CRITICAL: Check if would exceed max periods per day
    if (wouldExceedMaxPeriods(teacher.id, 1, context, existingNewAssignments)) {
      console.log('      Reason: Teacher would exceed max periods per day.');
      return false;
    }
    
    if (teacher.assignedCoverageCount >= maxLoad) {
      console.log('      Reason: Teacher already at max load.');
      return false;
    }
    const isAbsent = context.absences.some(a => a.teacherId === teacher.id);
    if (isAbsent) {
      console.log('      Reason: Teacher is currently absent.');
      return false;
    }
    return true;
  });

  console.log(`  [Teacher Coverage] Filtered available teachers: ${availableTeachers.length}`);
  if (availableTeachers.length === 0) {
    console.log('  [Teacher Coverage] No available internal teachers after filtering.');
    return { reason: 'No available internal teachers', candidatesEvaluated };
  }

  // Sort by workload balance (prefer lower load)
  const sortedTeachers = availableTeachers.sort((a, b) => a.assignedCoverageCount - b.assignedCoverageCount);
  const selectedTeacher = sortedTeachers[0];
  console.log('  [Teacher Coverage] Selected teacher:', selectedTeacher.name || selectedTeacher.id);

  // Create assignment
  const assignment: IAssignment = {
    id: generateId(),
    absenceId: absence.id,
    absentTeacherId: absence.teacherId,
    absentTeacherName: absence.absentTeacherName,
    period,
    assignedToId: selectedTeacher.id,
    assignedToName: selectedTeacher.name,
    assignmentType: 'Internal Coverage',
    date: context.date,
    status: 'assigned',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  selectedTeacher.assignedCoverageCount++;
  console.log('  [Teacher Coverage] Internal teacher assignment created:', assignment.id);

  return { assignment, reason: 'Internal teacher assigned', candidatesEvaluated };
}

/**
 * Create manual override assignment
 */
async function createManualOverrideAssignment(
  prisma: PrismaClient,
  context: AssignmentContext,
  absence: IAbsence,
  period: string,
  assignedToId: string
): Promise<IAssignment> {
  // Find the assigned person (substitute or teacher)
  const substitute = context.substitutes.find(s => s.id === assignedToId);
  const teacher = context.teachers.find(t => t.id === assignedToId);

  const assignedToName = substitute?.name || teacher?.name || 'Unknown';

  const assignment: IAssignment = {
    id: generateId(),
    absenceId: absence.id,
    absentTeacherId: absence.teacherId,
    absentTeacherName: absence.absentTeacherName,
    period,
    assignedToId,
    assignedToName,
    assignmentType: 'Manual Override',
    date: context.date,
    status: 'assigned',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return assignment;
}

/**
 * Create no coverage assignment
 */
async function createNoCoverageAssignment(
  prisma: PrismaClient,
  context: AssignmentContext,
  absence: IAbsence,
  period: string
): Promise<IAssignment> {
  const assignment: IAssignment = {
    id: generateId(),
    absenceId: absence.id,
    absentTeacherId: absence.teacherId,
    absentTeacherName: absence.absentTeacherName,
    period,
    assignedToId: '',
    assignedToName: '',
    assignmentType: 'No Coverage',
    date: context.date,
    status: 'assigned',
    notes: 'No available staff after exhausting all role priorities',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return assignment;
}

/**
 * Update absence status based on coverage results
 */
async function updateAbsenceStatus(
  prisma: PrismaClient,
  absence: IAbsence,
  coverageResults: ICoverageResult[]
): Promise<void> {
  const coveredPeriods = coverageResults.filter(r => r.assigned !== null).length;
  const totalPeriods = coverageResults.length;

  let status: IAbsence['status'];
  if (coveredPeriods === 0) {
    status = 'No Coverage';
  } else if (coveredPeriods === totalPeriods) {
    status = 'Assigned';
  } else {
    status = 'Partially Assigned';
  }

  await prisma.absence.update({
    where: { id: absence.id },
    data: { status }
  });
}

/**
 * Save assignments to database
 */
async function saveAssignmentsToDatabase(
  prisma: PrismaClient,
  assignments: IAssignment[]
): Promise<void> {
  for (const assignment of assignments) {
    // Create or update coverage assignment record
    await prisma.coverageAssignment.upsert({
      where: { absenceId: assignment.absenceId },
      update: {
        [`period${assignment.period}`]: assignment.assignedToId,
        [`period${assignment.period}Type`]: assignment.assignmentType,
        status: 'assigned',
        notes: assignment.notes
      },
      create: {
        absenceId: assignment.absenceId,
        [`period${assignment.period}`]: assignment.assignedToId,
        [`period${assignment.period}Type`]: assignment.assignmentType,
        status: 'assigned',
        notes: assignment.notes
      }
    });
  }
}

// Helper functions
function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function resetDailyCoverageCounts(context: AssignmentContext): void {
  context.teachers.forEach(teacher => teacher.assignedCoverageCount = 0);
  context.substitutes.forEach(sub => sub.assignedCoverageCount = 0);
}

function hasQualificationMatch(
  substitute: ISubstitute,
  teacherId: string,
  context: AssignmentContext
): boolean {
  if (!context.settings.departmentMatchingEnabled) {
    return true;
  }

  const teacher = context.teachers.find(t => t.id === teacherId);
  if (!teacher) return false;

  return substitute.qualifications.includes(teacher.department);
}

function getTeacherDepartment(teacherId: string, context: AssignmentContext): string {
  const teacher = context.teachers.find(t => t.id === teacherId);
  return teacher?.department || '';
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * CRITICAL: Check for assignment conflicts - prevents double-booking
 * Returns true if there's a conflict, false if safe to assign
 */
function hasAssignmentConflict(
  personId: string,
  period: string,
  context: AssignmentContext,
  newAssignments: IAssignment[] = []
): boolean {
  if (!context.settings.conflictDetectionEnabled) {
    return false; // Conflict detection disabled
  }

  // Check existing assignments for this person in this period
  const existingConflict = context.existingAssignments.some(
    assignment => assignment.assignedToId === personId && assignment.period === period
  );
  
  if (existingConflict) {
    console.log(`      🚨 CONFLICT: ${personId} already assigned to period ${period} (existing assignment)`);
    return true;
  }

  // Check new assignments being made in this run
  const newAssignmentConflict = newAssignments.some(
    assignment => assignment.assignedToId === personId && assignment.period === period
  );
  
  if (newAssignmentConflict) {
    console.log(`      🚨 CONFLICT: ${personId} already assigned to period ${period} (new assignment)`);
    return true;
  }

  return false;
}

/**
 * CRITICAL: Check if person would exceed max periods per day
 */
function wouldExceedMaxPeriods(
  personId: string,
  additionalPeriods: number,
  context: AssignmentContext,
  newAssignments: IAssignment[] = []
): boolean {
  if (!context.settings.conflictDetectionEnabled) {
    return false; // Conflict detection disabled
  }

  // Count existing assignments for this person today
  const existingCount = context.existingAssignments.filter(
    assignment => assignment.assignedToId === personId
  ).length;

  // Count new assignments for this person in this run
  const newCount = newAssignments.filter(
    assignment => assignment.assignedToId === personId
  ).length;

  const totalPeriods = existingCount + newCount + additionalPeriods;
  
  if (totalPeriods > context.settings.maxPeriodsPerPerson) {
    console.log(`      🚨 MAX PERIODS EXCEEDED: ${personId} would have ${totalPeriods}/${context.settings.maxPeriodsPerPerson} periods`);
    return true;
  }

  return false;
}

/**
 * CRITICAL: Check if periods would be too many consecutive
 * TODO: Implement consecutive period checking logic
 */
function wouldExceedConsecutivePeriods(
  personId: string,
  newPeriods: string[],
  context: AssignmentContext,
  newAssignments: IAssignment[] = []
): boolean {
  if (!context.settings.conflictDetectionEnabled) {
    return false; // Conflict detection disabled
  }

  // TODO: Implement consecutive period logic
  // For now, just check if adding too many periods at once
  if (newPeriods.length > context.settings.maxConsecutivePeriodsPerPerson) {
    console.log(`      🚨 CONSECUTIVE PERIODS EXCEEDED: ${personId} would have ${newPeriods.length} consecutive periods (max: ${context.settings.maxConsecutivePeriodsPerPerson})`);
    return true;
  }

  return false;
}

/**
 * CRITICAL: Check if person would exceed ABSOLUTE max periods per day (for full-day assignments)
 */
function wouldExceedAbsoluteMaxPeriods(
  personId: string,
  additionalPeriods: number,
  context: AssignmentContext,
  newAssignments: IAssignment[] = []
): boolean {
  // Count existing assignments for this person today
  const existingCount = context.existingAssignments.filter(
    assignment => assignment.assignedToId === personId
  ).length;

  // Count new assignments for this person in this run
  const newCount = newAssignments.filter(
    assignment => assignment.assignedToId === personId
  ).length;

  const totalPeriods = existingCount + newCount + additionalPeriods;
  const absoluteMaxPeriodsPerDay = 8; // Hard limit - no one works more than 8 periods
  
  if (totalPeriods > absoluteMaxPeriodsPerDay) {
    console.log(`      🚨 ABSOLUTE MAX PERIODS EXCEEDED: ${personId} would have ${totalPeriods}/${absoluteMaxPeriodsPerDay} periods`);
    return true;
  }

  return false;
}

function getDefaultSettings(): ISettings {
  return {
    schoolName: 'Default School',
    schoolYearStart: '2024-09-01',
    schoolYearEnd: '2025-06-30',

    periodsPerDay: 8,
    periodNames: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
    abScheduleType: 'None',
    nonTeachingPeriodTypes: ['Prep', 'PLC', 'PD', 'Lunch'],
    maxSubstituteCoverage: 6,
    maxInternalCoverageNormal: 2,
    maxInternalCoverageEmergency: 4,
    departmentMatchingEnabled: true,
    workloadBalancingEnabled: true,
    absenceTypes: [
      { name: 'Full Day', periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'] },
      { name: 'Half Day AM', periods: ['1st', '2nd', '3rd', '4th'] },
      { name: 'Half Day PM', periods: ['5th', '6th', '7th', '8th'] },
      { name: 'Para', periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'] }
    ],

    approvalRequired: true,
    autoAssignEnabled: true,
    
    // Main Office Settings - CRITICAL FOR CONFLICT DETECTION
    maxPeriodsPerPerson: 6, // no person can be assigned more than 6 periods per day
    maxConsecutivePeriodsPerPerson: 4, // no person can be assigned more than 4 consecutive periods
    fullDayThreshold: 5, // 5+ periods constitutes a full day
    conflictDetectionEnabled: true, // prevent double-booking
    
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Data conversion functions
function convertToITeacher(user: any): ITeacher {
  return {
    id: user.id,
    name: user.name,
    department: user.department || '',
    email: user.email,
    phone: '', // Add phone field to User model if needed
    schedule: {}, // Would need to be populated from master schedule
    assignedCoverageCount: 0,
    isInternal: true,
    isPara: false, // Would need to be determined from user data
    maxLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function convertToISubstitute(sub: any): ISubstitute {
  return {
    id: sub.id,
    name: sub.name,
    email: sub.email,
    phone: sub.cell || '',
    qualifications: Array.isArray(sub.subjectSpecialties)
      ? sub.subjectSpecialties
      : JSON.parse(sub.subjectSpecialties || '[]'),
    availability: typeof sub.availability === 'string'
      ? JSON.parse(sub.availability)
      : sub.availability || {},
    assignedCoverageCount: 0,
    isInternal: false,
    maxDailyLoad: 6,
    maxWeeklyLoad: 30,
    preferredTeacherId: sub.preferredTeacherId,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt
  };
}

function convertToIAbsence(absence: any, teachers?: any[], masterSchedule?: any[]): IAbsence {
  const periods = Array.isArray(absence.periods)
    ? absence.periods
    : JSON.parse(absence.periods || '[]');

  // Lookup teacher name if teachers array is provided
  let teacherName = '';
  if (teachers && Array.isArray(teachers)) {
    const teacher = teachers.find(t => t.id === absence.teacherId);
    teacherName = teacher ? teacher.name : '';
  }

  // Filter periods to only include teaching periods if master schedule is available
  let teachingPeriods = periods.map((p: any) => String(p));
  if (masterSchedule && Array.isArray(masterSchedule)) {
    const dayOfWeek = getDayOfWeek(new Date(absence.date));
    const teacherSchedule = masterSchedule.filter(ms => 
      ms.teacherId === absence.teacherId && 
      ms.dayOfWeek === dayOfWeek && 
      ms.isTeaching === true
    );
    
    if (teacherSchedule.length > 0) {
      const teachingPeriodsFromSchedule = teacherSchedule.map(ms => String(ms.period));
      // Only include periods where the teacher is actually teaching
      teachingPeriods = periods
        .map((p: any) => String(p))
        .filter((period: string) => teachingPeriodsFromSchedule.includes(period));
    }
  }

  // Determine priority based on teacher department/role - PARAPROFESSIONALS HIGHEST
  let priority = 3; // Default for regular teachers
  if (teachers && Array.isArray(teachers)) {
    const teacher = teachers.find(t => t.id === absence.teacherId);
    if (teacher) {
      console.log(`🎯 Priority Check for ${teacher.name}: Department="${teacher.department}", Role="${teacher.role}"`);
      if (teacher.department === 'Paraprofessional' || teacher.role === 'paraprofessional') {
        priority = 1; // HIGHEST PRIORITY for paraprofessionals
        console.log(`  ⭐ PARAPROFESSIONAL DETECTED - Setting priority to 1 (HIGHEST)`);
      } else if (teachingPeriods.length >= 5) {
        priority = 2; // High priority for full-day teachers
        console.log(`  📚 Full-day teacher - Setting priority to 2`);
      } else {
        console.log(`  📖 Regular teacher - Setting priority to 3`);
      }
    }
  }

  return {
    id: absence.id,
    teacherId: absence.teacherId,
    absentTeacherName: teacherName, // Use looked up name
    date: absence.date instanceof Date ? absence.date.toISOString().split('T')[0] : absence.date,
    dayType: 'A', // Default to 'A' for one-day cycle
    type: teachingPeriods.length >= 5 ? 'Full Day' : 'Custom',
    periods: teachingPeriods,
    periodsToCover: teachingPeriods, // Only teaching periods need coverage
    status: absence.status,
    manualOverride: {},
    priority: priority, // Dynamic priority based on role
    createdAt: absence.createdAt,
    updatedAt: absence.updatedAt
  };
}

function convertToIAssignment(assignment: any): IAssignment {
  return {
    id: assignment.id,
    absenceId: assignment.absenceId,
    absentTeacherId: '', // Would need to be populated
    absentTeacherName: '', // Would need to be populated
    period: '', // Would need to be extracted from period fields
    assignedToId: '', // Would need to be extracted from period fields
    assignedToName: '', // Would need to be populated
    assignmentType: 'External Sub', // Would need to be determined
    date: '', // Would need to be populated
    status: 'assigned',
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
  };
}

/**
 * Handle preferred substitute pull from master schedule
 * When a teacher is absent, check if any substitutes have them as preferred teacher
 * and automatically create absences for those substitutes if they're scheduled to work
 */
async function handlePreferredSubstitutePull(
  prisma: PrismaClient,
  date: string,
  absences: IAbsence[]
): Promise<void> {
  try {
    const absentTeacherIds = absences.map(a => a.teacherId);
    
    if (absentTeacherIds.length === 0) {
      console.log('  No absent teachers found, skipping preferred substitute pull');
      return;
    }
    
    // Find substitutes who have preferred teachers that are absent today
    const preferredSubstitutes = await prisma.substitute.findMany({
      where: {
        preferredTeacherId: {
          in: absentTeacherIds
        }
      },
      include: {
        attendanceRecords: {
          where: {
            date: new Date(date)
          }
        }
      }
    });
    
    console.log(`  Found ${preferredSubstitutes.length} substitutes with preferred teachers who are absent`);
    
    for (const substitute of preferredSubstitutes) {
      // Check if substitute already has an absence record for today
      const existingAbsence = substitute.attendanceRecords.find(
        record => record.date.toISOString().split('T')[0] === date
      );
      
      if (existingAbsence) {
        console.log(`    ${substitute.name} already has attendance record for ${date}`);
        continue;
      }
      
      // Find the preferred teacher's absence
      const preferredTeacherAbsence = absences.find(
        a => a.teacherId === substitute.preferredTeacherId
      );
      
      if (!preferredTeacherAbsence) {
        continue;
      }
      
      console.log(`    🎯 Auto-pulling ${substitute.name} from schedule (preferred teacher ${preferredTeacherAbsence.absentTeacherName} is absent)`);
      
      // Create a substitute attendance record indicating they're pulled from schedule
      await prisma.substituteAttendance.create({
        data: {
          substituteId: substitute.id,
          absenceId: preferredTeacherAbsence.id,
          date: new Date(date),
          status: 'pulled_from_schedule',
          notes: `Automatically pulled from master schedule because preferred teacher ${preferredTeacherAbsence.absentTeacherName} is absent`,
          periodsWorked: JSON.stringify(preferredTeacherAbsence.periods)
        }
      });
      
      console.log(`    ✅ Created pull record for ${substitute.name}`);
    }
    
  } catch (error) {
    console.error('Error handling preferred substitute pull:', error);
  }
} 
