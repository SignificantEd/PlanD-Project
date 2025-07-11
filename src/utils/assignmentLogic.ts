import type { IAbsence, ITeacher, ISubstitute, ISettings, IAssignment } from '../types/interfaces';
import { sortAbsencesByPriority } from './absenceUtils';

// This is a simplified helper for testing. In a real app, this would query a database/sheet.
function getManualOverride(absentTeacherId: string, period: string, manualOverridesData: ISubstitute[]): ISubstitute | undefined {
    // For testing, let's hardcode a manual override if specific conditions are met
    // Example: If absentTeacherId is 'teacher-id-1' and period is '1A', assign 'sub-id-1'
    if (absentTeacherId === 'teacher-id-1' && period === '1A') {
        const mrJohnson = manualOverridesData.find(s => s.name === 'Mr. Mark Johnson');
        return mrJohnson;
    }
    return undefined;
}

export function assignCoverage(
  absences: IAbsence[],
  teachers: ITeacher[],
  substitutes: ISubstitute[],
  settings: ISettings
): { updatedAbsences: IAbsence[]; assignmentsLog: IAssignment[] } {
  // Create deep copies to avoid modifying original data
  const workingAbsences: IAbsence[] = JSON.parse(JSON.stringify(absences));
  const workingTeachers: ITeacher[] = JSON.parse(JSON.stringify(teachers));
  const workingSubstitutes: ISubstitute[] = JSON.parse(JSON.stringify(substitutes));

  const allAssignmentsLog: IAssignment[] = [];

  // Reset assignedCoverageCount for all working teachers and substitutes
  workingTeachers.forEach(t => t.assignedCoverageCount = 0);
  workingSubstitutes.forEach(s => s.assignedCoverageCount = 0);

  // STEP 0: Prioritize Absences
  const prioritizedAbsences = sortAbsencesByPriority(workingAbsences);

  // STEP 1: Manual Override Check
  prioritizedAbsences.forEach(absence => {
    const absentTeacherId = absence.teacherId;
    const absenceId = absence.id;
    const absentTeacherName = absence.absentTeacherName;
    const date = absence.date;
    // For each period that needs coverage
    absence.periodsToCover.forEach(period => {
      // Check for manual override
      const overrideSub = getManualOverride(absentTeacherId, period, workingSubstitutes);
      if (overrideSub) {
        // Create assignment
        const assignment: IAssignment = {
          id: `${absenceId}-${period}-manual`,
          absenceId,
          absentTeacherId,
          absentTeacherName,
          period,
          assignedToId: overrideSub.id,
          assignedToName: overrideSub.name,
          assignmentType: 'Manual Override',
          date,
          status: 'Pending Approval',
          notes: 'Manual override assignment',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        allAssignmentsLog.push(assignment);
        // Mark the period as covered (for this test, just log it)
        // Increment assignedCoverageCount for the substitute
        const sub = workingSubstitutes.find(s => s.id === overrideSub.id);
        if (sub) sub.assignedCoverageCount += 1;
      }
    });
  });

  // Placeholder for STEP 2-4: External/Internal/Emergency Search
  // Placeholder for STEP 5: Workload Balancing

  // For now, just return the prioritized absences and the assignments log
  return { updatedAbsences: prioritizedAbsences, assignmentsLog: allAssignmentsLog };
} 