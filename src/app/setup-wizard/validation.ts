// Validation helpers for the setup wizard

export function validateStep(step: number, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (step) {
    case 1: // School Information
      if (!data.name?.trim()) {
        errors.push('School name is required');
      }
      if (!data.location?.trim()) {
        errors.push('School location is required');
      }
      if (!data.contact?.trim()) {
        errors.push('Primary contact email is required');
      } else if (!isValidEmail(data.contact)) {
        errors.push('Please enter a valid email address');
      }
      if (!data.studentCount || data.studentCount < 1) {
        errors.push('Student count must be at least 1');
      }
      break;

    case 2: // Schedule Configuration
      if (!data.periods || data.periods.length === 0) {
        errors.push('At least one period is required');
      }
      if (data.periods) {
        data.periods.forEach((period: any, index: number) => {
          if (!period.name?.trim()) {
            errors.push(`Period ${index + 1} must have a name`);
          }
          if (!period.start) {
            errors.push(`Period ${index + 1} must have a start time`);
          }
          if (!period.end) {
            errors.push(`Period ${index + 1} must have an end time`);
          }
          if (period.start && period.end && period.start >= period.end) {
            errors.push(`Period ${index + 1} start time must be before end time`);
          }
        });
      }
      break;

    case 3: // Staff Upload
      if (!data.teachers || data.teachers.length === 0) {
        errors.push('At least one staff member is required');
      }
      if (data.teachers) {
        data.teachers.forEach((teacher: any, index: number) => {
          if (!teacher.name?.trim()) {
            errors.push(`Staff member ${index + 1} must have a name`);
          }
          if (!teacher.email?.trim()) {
            errors.push(`Staff member ${index + 1} must have an email`);
          } else if (!isValidEmail(teacher.email)) {
            errors.push(`Staff member ${index + 1} must have a valid email address`);
          }
          if (!teacher.department?.trim()) {
            errors.push(`Staff member ${index + 1} must have a department`);
          }
        });
        
        // Check for duplicate emails
        const emails = data.teachers.map((t: any) => t.email?.toLowerCase()).filter(Boolean);
        const duplicateEmails = emails.filter((email: string, index: number) => emails.indexOf(email) !== index);
        if (duplicateEmails.length > 0) {
          errors.push('Duplicate email addresses found. Each staff member must have a unique email.');
        }
      }
      break;

    case 4: // Substitute Pool
      if (data.substitutes && data.substitutes.length > 0) {
        data.substitutes.forEach((substitute: any, index: number) => {
          if (!substitute.name?.trim()) {
            errors.push(`Substitute ${index + 1} must have a name`);
          }
          if (!substitute.email?.trim()) {
            errors.push(`Substitute ${index + 1} must have an email`);
          } else if (!isValidEmail(substitute.email)) {
            errors.push(`Substitute ${index + 1} must have a valid email address`);
          }
          if (substitute.maxPeriodsPerDay < 1 || substitute.maxPeriodsPerDay > 8) {
            errors.push(`Substitute ${index + 1} max periods per day must be between 1 and 8`);
          }
          
          // Check if at least one day is available
          const availableDays = Object.values(substitute.availability || {}).filter(Boolean);
          if (availableDays.length === 0) {
            errors.push(`Substitute ${index + 1} must be available at least one day per week`);
          }
        });
        
        // Check for duplicate emails
        const emails = data.substitutes.map((s: any) => s.email?.toLowerCase()).filter(Boolean);
        const duplicateEmails = emails.filter((email: string, index: number) => emails.indexOf(email) !== index);
        if (duplicateEmails.length > 0) {
          errors.push('Duplicate substitute email addresses found. Each substitute must have a unique email.');
        }
      }
      break;

    case 5: // Coverage Rules
      if (!data.constraints) {
        errors.push('Coverage constraints are required');
        break;
      }
      
      const constraints = data.constraints;
      
      if (constraints.maxSubstituteCoverage < 1 || constraints.maxSubstituteCoverage > 8) {
        errors.push('Max substitute coverage must be between 1 and 8 periods');
      }
      if (constraints.maxInternalCoverageNormal < 0 || constraints.maxInternalCoverageNormal > 6) {
        errors.push('Max internal coverage (normal) must be between 0 and 6 periods');
      }
      if (constraints.maxInternalCoverageEmergency < 0 || constraints.maxInternalCoverageEmergency > 8) {
        errors.push('Max internal coverage (emergency) must be between 0 and 8 periods');
      }
      if (constraints.maxConsecutivePeriods < 2 || constraints.maxConsecutivePeriods > 8) {
        errors.push('Max consecutive periods must be between 2 and 8');
      }
      if (constraints.emergencyProtocols?.escalationTime < 5 || constraints.emergencyProtocols?.escalationTime > 120) {
        errors.push('Escalation time must be between 5 and 120 minutes');
      }
      break;

    default:
      errors.push('Unknown step');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 