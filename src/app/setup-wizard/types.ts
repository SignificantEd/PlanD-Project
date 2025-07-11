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
  teachers: any[];
};

export type SubstitutePool = {
  substitutes: any[];
};

export type CoverageRules = {
  constraints: any;
}; 