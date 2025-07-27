// Enterprise-grade TypeScript interfaces for PlanD Coverage Management System

export interface ITeacher {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  schedule: { [period: string]: string }; // e.g., {"1A": "Math 1", "2A": "Prep", "1B": "Math 2"}
  assignedCoverageCount: number; // tracks current coverage load for internal teachers
  isInternal: boolean; // always true for teachers
  isPara: boolean; // boolean, for para-educator absences
  maxLoad: number; // maximum coverage periods per day
  maxWeeklyLoad: number; // maximum coverage periods per week
  createdAt: Date;
  updatedAt: Date;
  
  // Method to check if teacher is available for coverage during a specific period
  isAvailableForCoverage?(period: string, settings: ISettings): boolean;
}

export interface ISubstitute {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualifications: string[]; // e.g., ["Math", "Science", "English"]
  availability: { [dayOfWeek: string]: string[] }; // e.g., {"Monday": ["1", "2", "3"], "Tuesday": ["Full Day"]}
  assignedCoverageCount: number; // tracks current coverage load for subs
  isInternal: boolean; // always false for external subs
  maxDailyLoad: number; // maximum periods per day (default 6)
  maxWeeklyLoad: number; // maximum periods per week
  preferredTeacherId?: string; // preferred teacher to work with
  createdAt: Date;
  updatedAt: Date;
}

export interface IAbsence {
  id: string;
  teacherId: string;
  absentTeacherName: string;
  date: string; // date string
  dayType: 'A' | 'B'; // A/B day designation
  type: 'Full Day' | 'Half Day AM' | 'Half Day PM' | 'Custom' | 'Para';
  periods: string[]; // periods affected by absence, derived from type
  periodsToCover: string[]; // periods where teacher is actually teaching and needs coverage
  status: 'Pending' | 'Assigned' | 'Partially Assigned' | 'No Coverage';
  manualOverride: { [period: string]: string }; // e.g., {"3": "subId123"}
  notes?: string;
  priority: number; // 1 = highest (Para), 2 = Full Day, 3 = Half Day, 4 = Custom
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment {
  id: string;
  absenceId: string;
  absentTeacherId: string;
  absentTeacherName: string;
  period: string;
  assignedToId: string;
  assignedToName: string;
  assignmentType: 'Manual Override' | 'External Sub' | 'Internal Coverage' | 'Emergency Coverage' | 'No Coverage';
  date: string; // date string
  status: 'assigned' | 'approved' | 'rejected';
  notes?: string; // e.g., reason for emergency
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettings {
  schoolName: string;
  schoolYearStart: string; // date string
  schoolYearEnd: string; // date string
  periodsPerDay: number;
  periodNames: string[]; // ["1st", "2nd", ...]
  abScheduleType: 'None';
  nonTeachingPeriodTypes: string[]; // ["Prep", "PLC", "PD", "Lunch"]
  maxSubstituteCoverage: number; // maximum periods per day for substitutes
  maxInternalCoverageNormal: number; // normal coverage limit for internal teachers
  maxInternalCoverageEmergency: number; // emergency coverage limit for internal teachers
  departmentMatchingEnabled: boolean;
  workloadBalancingEnabled: boolean;
  absenceTypes: { name: string; periods: string[] }[]; // predefined absence types
  approvalRequired: boolean; // whether assignments require admin approval
  autoAssignEnabled: boolean; // whether to auto-assign coverage
  
  // Main Office Settings - CRITICAL FOR CONFLICT DETECTION
  maxPeriodsPerPerson: number; // maximum periods any person can be assigned per day
  maxConsecutivePeriodsPerPerson: number; // maximum consecutive periods any person can be assigned
  fullDayThreshold: number; // number of periods that constitutes a full day (default 5)
  conflictDetectionEnabled: boolean; // whether to prevent double-booking
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoverageResult {
  period: string;
  assigned: string | null;
  assignedRole: 'external_substitute' | 'paraprofessional' | 'internal_teacher' | null;
  reason: string;
  candidateEvaluated: number;
  assignmentType: 'Manual Override' | 'External Sub' | 'Internal Coverage' | 'Emergency Coverage' | 'No Coverage';
  status: 'assigned' | 'approved' | 'rejected';
}

export interface IDashboardStats {
  teachersAbsent: number;
  periodsToCover: number;
  assignmentsMade: number;
  timeSaved: number; // calculated in minutes
  pendingApprovals: number;
  totalSubstitutes: number;
  totalTeachers: number;
  coverageRate: number; // percentage of periods covered
  coveredPeriods: number; // number of periods that have coverage
  totalPeriods: number; // total number of periods needing coverage
}

export interface IRecentActivity {
  id: string;
  type: 'absence_reported' | 'coverage_assigned' | 'assignment_approved' | 'assignment_rejected' | 'schedule_updated';
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  relatedId?: string; // ID of related absence, assignment, etc.
}

export interface IApprovalQueueItem {
  assignment: IAssignment;
  absence: IAbsence;
  teacher: ITeacher;
  substitute?: ISubstitute;
  assignedTeacher?: ITeacher;
}

export interface IHistoricalData {
  date: string;
  totalAbsences: number;
  totalPeriods: number;
  coveredPeriods: number;
  coverageRate: number;
  assignments: IAssignment[];
}

export interface IExportData {
  teachers: ITeacher[];
  substitutes: ISubstitute[];
  absences: IAbsence[];
  assignments: IAssignment[];
  settings: ISettings;
  exportDate: Date;
}

// CSV Import/Export interfaces
export interface ICSVTeacherRow {
  Teacher_Name: string;
  Department: string;
  Room: string;
  Email: string;
  Phone: string;
  isPara: string; // "true" or "false"
  [key: string]: string; // Dynamic period columns (1A, 1B, 2A, 2B, etc.)
  Prep_Periods: string; // comma-separated period numbers
  PLC_Periods: string; // comma-separated period numbers
  PD_Periods: string; // comma-separated period numbers
}

export interface ICSVSubstituteRow {
  Substitute_Name: string;
  Email: string;
  Phone: string;
  Qualifications: string; // comma-separated
  Availability_A: string; // comma-separated period numbers or "Full Day"
  Availability_B: string; // comma-separated period numbers or "Full Day"
}

// Algorithm-specific interfaces
export interface ICandidateStaff {
  id: string;
  name: string;
  role: 'external_substitute' | 'paraprofessional' | 'internal_teacher';
  department?: string;
  subjectSpecialties?: string[];
  availability: Record<string, string[]>;
  currentLoad: number;
  maxLoad: number;
  preferredTeacherId?: string;
}

export interface IAbsencePeriod {
  absent_teacher: string;
  date: Date;
  period_time: string;
  room: string;
  subject: string;
}

// Navigation and UI interfaces
export interface INavigationItem {
  name: string;
  href: string;
  icon?: string;
  badge?: number;
  current?: boolean;
}

export interface IChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ICalendarDay {
  date: string;
  absences: IAbsence[];
  assignments: IAssignment[];
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

// API Response interfaces
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search interfaces
export interface IAssignmentFilters {
  date?: string;
  teacherId?: string;
  substituteId?: string;
  assignmentType?: string;
  status?: string;
  dateRange?: { start: string; end: string };
}

export interface ISearchParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 