import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CoverageAssignment {
  teacherId: string;
  substituteId?: string;
  period: string;
  dayOfWeek: string;
  absenceId: string;
  type: 'Substitute' | 'Teacher' | 'Paraprofessional';
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  category: string;
  ruleType: 'hard' | 'soft' | 'preference';
  isViolated: boolean;
  message: string;
  preventAssignment: boolean;
  requireApproval: boolean;
  boostPriority: boolean;
  priority: number;
}

export interface LoadLimitCheck {
  teacherId: string;
  currentLoad: {
    periodsToday: number;
    periodsThisWeek: number;
    consecutivePeriods: number;
    coverageThisWeek: number;
  };
  limits: {
    maxPeriodsPerDay: number;
    maxPeriodsPerWeek: number;
    maxConsecutivePeriods: number;
    maxCoveragePerWeek: number;
  };
  isExceeded: boolean;
  violations: string[];
}

export class RulesEngine {
  private schoolId: string;

  constructor(schoolId: string) {
    this.schoolId = schoolId;
  }

  /**
   * Evaluate all constraints for a potential coverage assignment
   */
  async evaluateAssignment(
    assignment: CoverageAssignment,
    context: {
      teacher?: any;
      substitute?: any;
      absence?: any;
      periodConfig?: any;
      existingAssignments?: CoverageAssignment[];
    }
  ): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];

    // Get all active constraints for the school
    const constraints = await prisma.constraintConfig.findMany({
      where: {
        schoolId: this.schoolId,
        isActive: true
      },
      orderBy: { priority: 'asc' }
    });

    for (const constraint of constraints) {
      const result = await this.evaluateConstraint(constraint, assignment, context);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Evaluate a single constraint
   */
  private async evaluateConstraint(
    constraint: any,
    assignment: CoverageAssignment,
    context: any
  ): Promise<RuleEvaluationResult | null> {
    const conditions = constraint.conditions as any;
    const actions = constraint.actions as any;

    let isViolated = false;
    let message = '';

    // Evaluate conditions based on constraint type
    switch (constraint.category) {
      case 'union':
        isViolated = await this.evaluateUnionRule(conditions, assignment, context);
        break;
      case 'policy':
        isViolated = await this.evaluatePolicyRule(conditions, assignment, context);
        break;
      case 'safety':
        isViolated = await this.evaluateSafetyRule(conditions, assignment, context);
        break;
      case 'academic':
        isViolated = await this.evaluateAcademicRule(conditions, assignment, context);
        break;
      case 'custom':
        isViolated = await this.evaluateCustomRule(conditions, assignment, context);
        break;
    }

    if (isViolated) {
      message = actions.message || constraint.description;
    }

    return {
      ruleId: constraint.id,
      ruleName: constraint.name,
      category: constraint.category,
      ruleType: constraint.ruleType,
      isViolated,
      message,
      preventAssignment: actions.preventAssignment || false,
      requireApproval: actions.requireApproval || false,
      boostPriority: actions.boostPriority || false,
      priority: constraint.priority
    };
  }

  /**
   * Evaluate union rules (coverage limits, etc.)
   */
  private async evaluateUnionRule(conditions: any, assignment: CoverageAssignment, context: any): Promise<boolean> {
    if (conditions.teacherRole && context.teacher?.role !== conditions.teacherRole) {
      return false;
    }

    if (conditions.maxCoveragePerWeek) {
      const weeklyCoverage = await this.getWeeklyCoverageCount(assignment.teacherId);
      return weeklyCoverage >= conditions.maxCoveragePerWeek;
    }

    return false;
  }

  /**
   * Evaluate policy rules (department head protection, etc.)
   */
  private async evaluatePolicyRule(conditions: any, assignment: CoverageAssignment, context: any): Promise<boolean> {
    if (conditions.teacherRole && context.teacher?.role !== conditions.teacherRole) {
      return false;
    }

    if (conditions.duringPrepPeriod) {
      const isPrepPeriod = await this.isPrepPeriod(assignment.teacherId, assignment.period, assignment.dayOfWeek);
      return isPrepPeriod;
    }

    if (conditions.periodType && context.periodConfig?.type === conditions.periodType) {
      return true;
    }

    return false;
  }

  /**
   * Evaluate safety rules (consecutive periods, etc.)
   */
  private async evaluateSafetyRule(conditions: any, assignment: CoverageAssignment, context: any): Promise<boolean> {
    if (conditions.maxConsecutivePeriods) {
      const consecutivePeriods = await this.getConsecutivePeriods(assignment.teacherId, assignment.dayOfWeek);
      return consecutivePeriods >= conditions.maxConsecutivePeriods;
    }

    return false;
  }

  /**
   * Evaluate academic rules (subject match preferences, etc.)
   */
  private async evaluateAcademicRule(conditions: any, assignment: CoverageAssignment, context: any): Promise<boolean> {
    if (conditions.subjectMatch && context.substitute && context.absence) {
      const hasSubjectMatch = await this.hasSubjectMatch(context.substitute, context.absence);
      return !hasSubjectMatch; // Violated if no subject match when required
    }

    return false;
  }

  /**
   * Evaluate custom rules
   */
  private async evaluateCustomRule(conditions: any, assignment: CoverageAssignment, context: any): Promise<boolean> {
    // Custom rule evaluation logic can be extended here
    return false;
  }

  /**
   * Check load limits for a teacher
   */
  async checkLoadLimits(teacherId: string, date: Date): Promise<LoadLimitCheck> {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    // No loadLimitConfig on teacher, so use default limits
    return {
      teacherId,
      currentLoad: { periodsToday: 0, periodsThisWeek: 0, consecutivePeriods: 0, coverageThisWeek: 0 },
      limits: { maxPeriodsPerDay: 8, maxPeriodsPerWeek: 40, maxConsecutivePeriods: 6, maxCoveragePerWeek: 5 },
      isExceeded: false,
      violations: []
    };
  }

  /**
   * Get department-specific rules and preferences
   */
  async getDepartmentRules(departmentCode: string) {
    const departmentConfig = await prisma.departmentConfig.findFirst({
      where: {
        schoolId: this.schoolId,
        code: departmentCode,
        isActive: true
      }
    });

    return departmentConfig;
  }

  /**
   * Check if a period is a prep period for a teacher
   */
  private async isPrepPeriod(teacherId: string, period: string, dayOfWeek: string): Promise<boolean> {
    const schedule = await prisma.masterSchedule.findFirst({
      where: {
        teacherId,
        period,
        dayOfWeek,
        isTeaching: false
      }
    });

    return !!schedule;
  }

  /**
   * Get consecutive periods for a teacher on a given day
   */
  private async getConsecutivePeriods(teacherId: string, dayOfWeek: string): Promise<number> {
    const schedules = await prisma.masterSchedule.findMany({
      where: {
        teacherId,
        dayOfWeek,
        isTeaching: true
      },
      orderBy: { period: 'asc' }
    });

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const schedule of schedules) {
      if (schedule.isTeaching) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  /**
   * Get periods today for a teacher
   */
  private async getPeriodsToday(teacherId: string, date: Date): Promise<number> {
    const dayOfWeek = this.getDayOfWeek(date);
    
    const count = await prisma.masterSchedule.count({
      where: {
        teacherId,
        dayOfWeek,
        isTeaching: true
      }
    });

    return count;
  }

  /**
   * Get periods this week for a teacher
   */
  private async getPeriodsThisWeek(teacherId: string, date: Date): Promise<number> {
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    // This is a simplified calculation - in practice, you'd need to consider the actual schedule
    const dailyPeriods = await this.getPeriodsToday(teacherId, date);
    return dailyPeriods * 5; // Assuming 5 school days per week
  }

  /**
   * Get weekly coverage count for a teacher
   */
  private async getWeeklyCoverageCount(teacherId: string): Promise<number> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = this.getWeekEnd(new Date());

    const count = await prisma.coverageAssignment.count({
      where: {
        absence: {
          teacherId: teacherId,
          date: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      }
    });

    return count;
  }

  /**
   * Check if substitute has subject match for absence
   */
  private async hasSubjectMatch(substitute: any, absence: any): Promise<boolean> {
    const substituteSpecialties = substitute.subjectSpecialties as string[];
    const absenceSubject = absence.subject;

    return substituteSpecialties.includes(absenceSubject);
  }

  /**
   * Helper: Get day of week from date
   */
  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Helper: Get week start (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Helper: Get week end (Friday)
   */
  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
    return weekEnd;
  }

  /**
   * Get all available substitutes for a given period and day
   */
  async getAvailableSubstitutes(period: string, dayOfWeek: string, subject?: string): Promise<any[]> {
    const substitutes = await prisma.substitute.findMany({
      where: {
        loadLimitConfig: {
          isActive: true
        }
      },
      include: {
        loadLimitConfig: true
      }
    });

    const availableSubstitutes = [];

    for (const substitute of substitutes) {
      const availability = substitute.availability as any;
      const isAvailable = availability[dayOfWeek]?.includes(period);

      if (isAvailable) {
        // Check load limits
        const loadCheck = await this.checkSubstituteLoad(substitute.id, period, dayOfWeek);
        
        if (!loadCheck.isExceeded) {
          // Check subject match if specified
          if (subject) {
            const specialties = substitute.subjectSpecialties as string[];
            const hasSubjectMatch = specialties.includes(subject);
            
            availableSubstitutes.push({
              ...substitute,
              hasSubjectMatch,
              priority: hasSubjectMatch ? 1 : 2
            });
          } else {
            availableSubstitutes.push({
              ...substitute,
              hasSubjectMatch: false,
              priority: 2
            });
          }
        }
      }
    }

    // Sort by priority (subject match first, then availability)
    return availableSubstitutes.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check substitute load limits
   */
  private async checkSubstituteLoad(substituteId: string, period: string, dayOfWeek: string): Promise<LoadLimitCheck> {
    const substitute = await prisma.substitute.findUnique({
      where: { id: substituteId },
      include: { loadLimitConfig: true }
    });

    if (!substitute?.loadLimitConfig) {
      return {
        teacherId: substituteId,
        currentLoad: { periodsToday: 0, periodsThisWeek: 0, consecutivePeriods: 0, coverageThisWeek: 0 },
        limits: { maxPeriodsPerDay: 8, maxPeriodsPerWeek: 40, maxConsecutivePeriods: 6, maxCoveragePerWeek: 5 },
        isExceeded: false,
        violations: []
      };
    }

    // Simplified load check for substitutes
    const availability = substitute.availability as any;
    const periodsToday = availability[dayOfWeek]?.length || 0;

    const violations: string[] = [];
    if (periodsToday >= substitute.loadLimitConfig.maxPeriodsPerDay) {
      violations.push(`Daily period limit exceeded: ${periodsToday}/${substitute.loadLimitConfig.maxPeriodsPerDay}`);
    }

    return {
      teacherId: substituteId,
      currentLoad: { periodsToday, periodsThisWeek: 0, consecutivePeriods: 0, coverageThisWeek: 0 },
      limits: {
        maxPeriodsPerDay: substitute.loadLimitConfig.maxPeriodsPerDay,
        maxPeriodsPerWeek: substitute.loadLimitConfig.maxPeriodsPerWeek,
        maxConsecutivePeriods: substitute.loadLimitConfig.maxConsecutivePeriods,
        maxCoveragePerWeek: 5
      },
      isExceeded: violations.length > 0,
      violations
    };
  }
}

export default RulesEngine; 