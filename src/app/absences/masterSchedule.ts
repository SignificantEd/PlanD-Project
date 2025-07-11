export type PeriodAssignment = {
  period: string;           // e.g., "Period 1"
  subject: string;          // e.g., "Math"
  room: string;             // e.g., "Rm 201"
  isTeaching: boolean;      // true if teaching, false if free/prep
};

export type TeacherSchedule = {
  name: string;
  department: string;
  schedule: PeriodAssignment[];
};

export const masterSchedule: TeacherSchedule[] = [
  {
    name: "John Smith",
    department: "Math",
    schedule: [
      { period: "Period 1", subject: "Algebra I", room: "Rm 201", isTeaching: true },
      { period: "Period 2", subject: "Prep", room: "Rm 201", isTeaching: false },
      { period: "Period 3", subject: "Geometry", room: "Rm 201", isTeaching: true },
      { period: "Period 4", subject: "Algebra II", room: "Rm 201", isTeaching: true },
      { period: "Period 5", subject: "Lunch", room: "Cafeteria", isTeaching: false },
      { period: "Period 6", subject: "Algebra I", room: "Rm 201", isTeaching: true },
      { period: "Period 7", subject: "Duty", room: "Hallway", isTeaching: false },
      { period: "Period 8", subject: "Geometry", room: "Rm 201", isTeaching: true },
    ],
  },
  {
    name: "Sarah Jones",
    department: "English",
    schedule: [
      { period: "Period 1", subject: "English 9", room: "Rm 105", isTeaching: true },
      { period: "Period 2", subject: "English 10", room: "Rm 105", isTeaching: true },
      { period: "Period 3", subject: "Prep", room: "Rm 105", isTeaching: false },
      { period: "Period 4", subject: "English 11", room: "Rm 105", isTeaching: true },
      { period: "Period 5", subject: "Lunch", room: "Cafeteria", isTeaching: false },
      { period: "Period 6", subject: "English 12", room: "Rm 105", isTeaching: true },
      { period: "Period 7", subject: "Duty", room: "Library", isTeaching: false },
      { period: "Period 8", subject: "English 9", room: "Rm 105", isTeaching: true },
    ],
  },
  {
    name: "Emily Brown",
    department: "Science",
    schedule: [
      { period: "Period 1", subject: "Biology", room: "Rm 301", isTeaching: true },
      { period: "Period 2", subject: "Chemistry", room: "Rm 301", isTeaching: true },
      { period: "Period 3", subject: "Prep", room: "Rm 301", isTeaching: false },
      { period: "Period 4", subject: "Physics", room: "Rm 301", isTeaching: true },
      { period: "Period 5", subject: "Lunch", room: "Cafeteria", isTeaching: false },
      { period: "Period 6", subject: "Biology", room: "Rm 301", isTeaching: true },
      { period: "Period 7", subject: "Duty", room: "Lab", isTeaching: false },
      { period: "Period 8", subject: "Chemistry", room: "Rm 301", isTeaching: true },
    ],
  },
];

/**
 * Returns the periods to cover for an absence, based on the teacher's schedule and absence type.
 * @param schedule - Array of PeriodAssignment for the teacher
 * @param absenceType - 'Full Day' | 'Half Day AM' | 'Half Day PM' | 'Custom'
 * @param customPeriods - (optional) Only for 'Custom' type, array of period names to consider
 */
export function getPeriodsToCover(
  schedule: PeriodAssignment[],
  absenceType: 'Full Day' | 'Half Day AM' | 'Half Day PM' | 'Custom',
  customPeriods?: string[]
): string[] {
  // Only teaching periods
  const teachingPeriods = schedule.filter(p => p.isTeaching);

  if (absenceType === 'Full Day') {
    return teachingPeriods.map(p => p.period);
  }
  if (absenceType === 'Half Day AM') {
    // Assuming AM = 1st-4th
    return teachingPeriods.filter(p => ['1st', '2nd', '3rd', '4th'].includes(p.period)).map(p => p.period);
  }
  if (absenceType === 'Half Day PM') {
    // Assuming PM = 5th-8th
    return teachingPeriods.filter(p => ['5th', '6th', '7th', '8th'].includes(p.period)).map(p => p.period);
  }
  if (absenceType === 'Custom' && customPeriods) {
    return teachingPeriods.filter(p => customPeriods.includes(p.period)).map(p => p.period);
  }
  return [];
} 