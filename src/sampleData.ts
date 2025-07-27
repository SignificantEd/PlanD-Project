import { 
  ITeacher, 
  ISubstitute, 
  IAbsence, 
  IAssignment, 
  ISettings,
  ICoverageResult,
  IDashboardStats 
} from './types/interfaces';

// Sample Teachers
export const sampleTeachers: ITeacher[] = [
  {
    id: 't1',
    name: 'Ms. Sarah Johnson',
    department: 'Mathematics',
    email: 'sarah.johnson@school.edu',
    phone: '555-0101',
    schedule: {
      '1st': 'Algebra I',
      '2nd': 'Geometry',
      '3rd': 'Free Period',
      '4th': 'Calculus',
      '5th': 'Algebra II',
      '6th': 'Free Period',
      '7th': 'Statistics',
      '8th': 'Prep'
    },
    assignedCoverageCount: 0,
    isInternal: true,
    isPara: false,
    maxLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isAvailableForCoverage(period: string, settings: ISettings): boolean {
      const courseName = this.schedule[period];
      if (!courseName) return false;
      
      // Check if the period is a non-teaching period (free/prep/lunch)
      const isNonTeachingPeriod = settings.nonTeachingPeriodTypes.some(nonTeachingType => 
        courseName.toLowerCase().includes(nonTeachingType.toLowerCase()) ||
        courseName.toLowerCase().includes('free') ||
        courseName.toLowerCase().includes('prep')
      );
      
      return isNonTeachingPeriod;
    }
  },
  {
    id: 't2',
    name: 'Mr. Michael Chen',
    department: 'Science',
    email: 'michael.chen@school.edu',
    phone: '555-0102',
    schedule: {
      '1st': 'Biology',
      '2nd': 'Chemistry',
      '3rd': 'Physics',
      '4th': 'Free Period',
      '5th': 'Biology',
      '6th': 'Chemistry',
      '7th': 'Free Period',
      '8th': 'Prep'
    },
    assignedCoverageCount: 1,
    isInternal: true,
    isPara: false,
    maxLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isAvailableForCoverage(period: string, settings: ISettings): boolean {
      const courseName = this.schedule[period];
      if (!courseName) return false;
      
      // Check if the period is a non-teaching period (free/prep/lunch)
      const isNonTeachingPeriod = settings.nonTeachingPeriodTypes.some(nonTeachingType => 
        courseName.toLowerCase().includes(nonTeachingType.toLowerCase()) ||
        courseName.toLowerCase().includes('free') ||
        courseName.toLowerCase().includes('prep')
      );
      
      return isNonTeachingPeriod;
    }
  },
  {
    id: 't3',
    name: 'Ms. Jennifer Adams',
    department: 'Paraprofessional',
    email: 'jennifer.adams@school.edu',
    phone: '555-0103',
    schedule: {
      '1st': 'Math Support',
      '2nd': 'English Support',
      '3rd': 'Science Support',
      '4th': 'Free Period',
      '5th': 'Resource Room',
      '6th': 'Study Hall',
      '7th': 'Supervision',
      '8th': 'Prep'
    },
    assignedCoverageCount: 0,
    isInternal: true,
    isPara: true,
    maxLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isAvailableForCoverage(period: string, settings: ISettings): boolean {
      const courseName = this.schedule[period];
      if (!courseName) return false;
      
      // Check if the period is a non-teaching period (free/prep/lunch)
      const isNonTeachingPeriod = settings.nonTeachingPeriodTypes.some(nonTeachingType => 
        courseName.toLowerCase().includes(nonTeachingType.toLowerCase()) ||
        courseName.toLowerCase().includes('free') ||
        courseName.toLowerCase().includes('prep')
      );
      
      return isNonTeachingPeriod;
    }
  },
  {
    id: 'teacher-id-1',
    name: 'Mr. Override Test',
    department: 'Test',
    email: 'override.teacher@school.edu',
    phone: '555-9999',
    schedule: {
      '1A': 'Math Override',
      '2A': 'Free Period',
      '3A': 'Prep',
      '4A': 'Science',
      '5A': 'Free Period',
      '6A': 'Prep',
      '7A': 'English',
      '8A': 'Prep'
    },
    assignedCoverageCount: 0,
    isInternal: true,
    isPara: false,
    maxLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isAvailableForCoverage(period: string, settings: ISettings): boolean {
      const courseName = this.schedule[period];
      if (!courseName) return false;
      const isNonTeachingPeriod = settings.nonTeachingPeriodTypes.some(nonTeachingType => 
        courseName.toLowerCase().includes(nonTeachingType.toLowerCase()) ||
        courseName.toLowerCase().includes('free') ||
        courseName.toLowerCase().includes('prep')
      );
      return isNonTeachingPeriod;
    }
  }
];

// Sample Substitutes
export const sampleSubstitutes: ISubstitute[] = [
  {
    id: 's1',
    name: 'Alex Carter',
    email: 'alex.carter@substitute.edu',
    phone: '555-0201',
    qualifications: ['Mathematics', 'Science'],
    availability: {
      'A': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
      'B': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
    },
    assignedCoverageCount: 2,
    isInternal: false,
    maxDailyLoad: 6,
    maxWeeklyLoad: 30,
    preferredTeacherId: 't1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 's2',
    name: 'Morgan Lee',
    email: 'morgan.lee@substitute.edu',
    phone: '555-0202',
    qualifications: ['English', 'History'],
    availability: {
      'A': ['1st', '2nd', '3rd', '4th'],
      'B': ['5th', '6th', '7th', '8th']
    },
    assignedCoverageCount: 1,
    isInternal: false,
    maxDailyLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'sub-id-1',
    name: 'Mr. Mark Johnson',
    email: 'mr.mark.johnson@substitute.edu',
    phone: '555-8888',
    qualifications: ['Mathematics'],
    availability: {
      'A': ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A'],
      'B': ['1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B']
    },
    assignedCoverageCount: 0,
    isInternal: false,
    maxDailyLoad: 6,
    maxWeeklyLoad: 30,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Sample Absences
export const sampleAbsences: IAbsence[] = [
  {
    id: 'a1',
    teacherId: 't1',
    absentTeacherName: 'Ms. Sarah Johnson',
    date: '2024-01-15',
    dayType: 'A',
    type: 'Full Day',
    periods: ['1st', '2nd', '4th', '5th', '7th'],
    periodsToCover: ['1st', '2nd', '4th', '5th', '7th'],
    status: 'Pending',
    manualOverride: {},
    notes: 'Personal day',
    priority: 2,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: 'a2',
    teacherId: 't2',
    absentTeacherName: 'Mr. Michael Chen',
    date: '2024-01-15',
    dayType: 'A',
    type: 'Half Day AM',
    periods: ['1st', '2nd', '3rd'],
    periodsToCover: ['1st', '2nd', '3rd'],
    status: 'Assigned',
    manualOverride: {},
    notes: 'Doctor appointment',
    priority: 3,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: 'a-override',
    teacherId: 'teacher-id-1',
    absentTeacherName: 'Mr. Override Test',
    date: '2024-01-16',
    dayType: 'A',
    type: 'Full Day',
    periods: ['1A', '2A', '4A'],
    periodsToCover: ['1A'],
    status: 'Pending',
    manualOverride: {},
    notes: 'Manual override test',
    priority: 2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

// Sample Assignments
export const sampleAssignments: IAssignment[] = [
  {
    id: 'as1',
    absenceId: 'a1',
    absentTeacherId: 't1',
    absentTeacherName: 'Ms. Sarah Johnson',
    period: '1st',
    assignedToId: 's1',
    assignedToName: 'Alex Carter',
    assignmentType: 'External Sub',
    date: '2024-01-15',
    status: 'approved',
    notes: 'Regular coverage assignment',
    approvedBy: 'admin1',
    approvedAt: new Date('2024-01-14'),
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: 'as2',
    absenceId: 'a1',
    absentTeacherId: 't1',
    absentTeacherName: 'Ms. Sarah Johnson',
    period: '2nd',
    assignedToId: 't3',
    assignedToName: 'Ms. Jennifer Adams',
    assignmentType: 'Internal Coverage',
    date: '2024-01-15',
    status: 'assigned',
    notes: 'Internal coverage assignment',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  }
];

// Sample Settings
export const sampleSettings: ISettings = {
  schoolName: 'Sample High School',
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
    { name: 'Half Day PM', periods: ['5th', '6th', '7th', '8th'] }
  ],
  approvalRequired: true,
  autoAssignEnabled: true,
  maxPeriodsPerPerson: 6,
  maxConsecutivePeriodsPerPerson: 3,
  fullDayThreshold: 5,
  conflictDetectionEnabled: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

// Sample Coverage Results
export const sampleCoverageResults: ICoverageResult[] = [
  {
    period: '1st',
    assigned: 'Alex Carter',
    assignedRole: 'external_substitute',
    reason: 'Best match for Mathematics department',
    candidateEvaluated: 5,
    assignmentType: 'External Sub',
    status: 'approved'
  },
  {
    period: '2nd',
    assigned: 'Ms. Jennifer Adams',
    assignedRole: 'paraprofessional',
    reason: 'Internal coverage - available during period',
    candidateEvaluated: 3,
    assignmentType: 'Internal Coverage',
    status: 'assigned'
  }
];

// Sample Dashboard Stats
export const sampleDashboardStats: IDashboardStats = {
  teachersAbsent: 2,
  periodsToCover: 8,
  assignmentsMade: 6,
  timeSaved: 45,
  pendingApprovals: 2,
  totalSubstitutes: 2,
  totalTeachers: 3,
  coverageRate: 75.0,
  coveredPeriods: 6,
  totalPeriods: 8
};

// Helper function to get sample data by type
export const getSampleData = {
  teachers: () => sampleTeachers,
  substitutes: () => sampleSubstitutes,
  absences: () => sampleAbsences,
  assignments: () => sampleAssignments,
  settings: () => sampleSettings,
  coverageResults: () => sampleCoverageResults,
  dashboardStats: () => sampleDashboardStats
}; 