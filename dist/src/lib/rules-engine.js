import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class RulesEngine {
    constructor(schoolId) {
        this.schoolId = schoolId;
    }
    /**
     * Evaluate all constraints for a potential coverage assignment
     */
    async evaluateAssignment(assignment, context) {
        const results = [];
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
    async evaluateConstraint(constraint, assignment, context) {
        const conditions = constraint.conditions;
        const actions = constraint.actions;
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
    async evaluateUnionRule(conditions, assignment, context) {
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
    async evaluatePolicyRule(conditions, assignment, context) {
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
    async evaluateSafetyRule(conditions, assignment, context) {
        if (conditions.maxConsecutivePeriods) {
            const consecutivePeriods = await this.getConsecutivePeriods(assignment.teacherId, assignment.dayOfWeek);
            return consecutivePeriods >= conditions.maxConsecutivePeriods;
        }
        return false;
    }
    /**
     * Evaluate academic rules (subject match preferences, etc.)
     */
    async evaluateAcademicRule(conditions, assignment, context) {
        if (conditions.subjectMatch && context.substitute && context.absence) {
            const hasSubjectMatch = await this.hasSubjectMatch(context.substitute, context.absence);
            return !hasSubjectMatch; // Violated if no subject match when required
        }
        return false;
    }
    /**
     * Evaluate custom rules
     */
    async evaluateCustomRule(conditions, assignment, context) {
        // Custom rule evaluation logic can be extended here
        return false;
    }
    /**
     * Check load limits for a teacher
     */
    async checkLoadLimits(teacherId, date) {
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
            include: { loadLimitConfig: true }
        });
        if (!teacher?.loadLimitConfig) {
            return {
                teacherId,
                currentLoad: { periodsToday: 0, periodsThisWeek: 0, consecutivePeriods: 0, coverageThisWeek: 0 },
                limits: { maxPeriodsPerDay: 8, maxPeriodsPerWeek: 40, maxConsecutivePeriods: 6, maxCoveragePerWeek: 5 },
                isExceeded: false,
                violations: []
            };
        }
        const limits = teacher.loadLimitConfig;
        const constraints = limits.constraints;
        // Get current load
        const periodsToday = await this.getPeriodsToday(teacherId, date);
        const periodsThisWeek = await this.getPeriodsThisWeek(teacherId, date);
        const consecutivePeriods = await this.getConsecutivePeriods(teacherId, this.getDayOfWeek(date));
        const coverageThisWeek = await this.getWeeklyCoverageCount(teacherId);
        const violations = [];
        if (periodsToday >= limits.maxPeriodsPerDay) {
            violations.push(`Daily period limit exceeded: ${periodsToday}/${limits.maxPeriodsPerDay}`);
        }
        if (periodsThisWeek >= limits.maxPeriodsPerWeek) {
            violations.push(`Weekly period limit exceeded: ${periodsThisWeek}/${limits.maxPeriodsPerWeek}`);
        }
        if (consecutivePeriods >= limits.maxConsecutivePeriods) {
            violations.push(`Consecutive period limit exceeded: ${consecutivePeriods}/${limits.maxConsecutivePeriods}`);
        }
        if (constraints?.maxCoveragePerWeek && coverageThisWeek >= constraints.maxCoveragePerWeek) {
            violations.push(`Weekly coverage limit exceeded: ${coverageThisWeek}/${constraints.maxCoveragePerWeek}`);
        }
        return {
            teacherId,
            currentLoad: { periodsToday, periodsThisWeek, consecutivePeriods, coverageThisWeek },
            limits: {
                maxPeriodsPerDay: limits.maxPeriodsPerDay,
                maxPeriodsPerWeek: limits.maxPeriodsPerWeek,
                maxConsecutivePeriods: limits.maxConsecutivePeriods,
                maxCoveragePerWeek: constraints?.maxCoveragePerWeek || 5
            },
            isExceeded: violations.length > 0,
            violations
        };
    }
    /**
     * Get department-specific rules and preferences
     */
    async getDepartmentRules(departmentCode) {
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
    async isPrepPeriod(teacherId, period, dayOfWeek) {
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
    async getConsecutivePeriods(teacherId, dayOfWeek) {
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
            }
            else {
                currentConsecutive = 0;
            }
        }
        return maxConsecutive;
    }
    /**
     * Get periods today for a teacher
     */
    async getPeriodsToday(teacherId, date) {
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
    async getPeriodsThisWeek(teacherId, date) {
        const weekStart = this.getWeekStart(date);
        const weekEnd = this.getWeekEnd(date);
        // This is a simplified calculation - in practice, you'd need to consider the actual schedule
        const dailyPeriods = await this.getPeriodsToday(teacherId, date);
        return dailyPeriods * 5; // Assuming 5 school days per week
    }
    /**
     * Get weekly coverage count for a teacher
     */
    async getWeeklyCoverageCount(teacherId) {
        const weekStart = this.getWeekStart(new Date());
        const weekEnd = this.getWeekEnd(new Date());
        const count = await prisma.coverageAssignment.count({
            where: {
                teacherId,
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            }
        });
        return count;
    }
    /**
     * Check if substitute has subject match for absence
     */
    async hasSubjectMatch(substitute, absence) {
        const substituteSpecialties = substitute.subjectSpecialties;
        const absenceSubject = absence.subject;
        return substituteSpecialties.includes(absenceSubject);
    }
    /**
     * Helper: Get day of week from date
     */
    getDayOfWeek(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }
    /**
     * Helper: Get week start (Monday)
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }
    /**
     * Helper: Get week end (Friday)
     */
    getWeekEnd(date) {
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 4); // Friday is 4 days after Monday
        return weekEnd;
    }
    /**
     * Get all available substitutes for a given period and day
     */
    async getAvailableSubstitutes(period, dayOfWeek, subject) {
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
            const availability = substitute.availability;
            const isAvailable = availability[dayOfWeek]?.includes(period);
            if (isAvailable) {
                // Check load limits
                const loadCheck = await this.checkSubstituteLoad(substitute.id, period, dayOfWeek);
                if (!loadCheck.isExceeded) {
                    // Check subject match if specified
                    if (subject) {
                        const specialties = substitute.subjectSpecialties;
                        const hasSubjectMatch = specialties.includes(subject);
                        availableSubstitutes.push({
                            ...substitute,
                            hasSubjectMatch,
                            priority: hasSubjectMatch ? 1 : 2
                        });
                    }
                    else {
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
    async checkSubstituteLoad(substituteId, period, dayOfWeek) {
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
        const availability = substitute.availability;
        const periodsToday = availability[dayOfWeek]?.length || 0;
        const violations = [];
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
