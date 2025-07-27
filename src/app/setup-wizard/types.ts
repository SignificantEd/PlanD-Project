// Types for the setup wizard

export type SchoolInfo = {
  name: string;
  location: string;
  type: string;
  studentCount: number;
  coverageResponsibility: string;
  contact: string;
};

export type ScheduleConfig = {
  cycleDays: string[];
  periods: { name: string; start: string; end: string }[];
  halfDays: string[];
  lunchPeriods: string[];
  roomSharing: boolean;
};

export type StaffUpload = {
  file: File | null;
  teachers: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
  }[];
};

export type SubstitutePool = {
  substitutes: {
    id: string;
    name: string;
    email: string;
    phone: string;
    subjectSpecialties: string[];
    certificationLevel: string;
    availability: {
      Monday: boolean;
      Tuesday: boolean;
      Wednesday: boolean;
      Thursday: boolean;
      Friday: boolean;
    };
    maxPeriodsPerDay: number;
    preferredSchools: string[];
    rating: number;
    notes: string;
  }[];
};

export type CoverageRules = {
  constraints: {
    maxSubstituteCoverage: number;
    maxInternalCoverageNormal: number;
    maxInternalCoverageEmergency: number;
    departmentMatchingEnabled: boolean;
    workloadBalancingEnabled: boolean;
    approvalRequired: boolean;
    unionCompliance: boolean;
    maxConsecutivePeriods: number;
    preventLunchCoverage: boolean;
    preventPrepCoverage: boolean;
    subjectMatchPreference: boolean;
    experienceWeighting: boolean;
    notificationSettings: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      adminAlerts: boolean;
      dailyReports: boolean;
    };
    emergencyProtocols: {
      autoAssignUncovered: boolean;
      escalationTime: number;
      backupContacts: {
        name: string;
        phone: string;
      }[];
    };
  };
}; 