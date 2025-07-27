import { PrismaClient } from '@prisma/client';
import { emailService, AssignmentEmailData, AdminAlertData, DailySummaryData } from './email-service';

const prisma = new PrismaClient();

export interface CoverageNotificationData {
  absenceId: string;
  assignments: Array<{
    id: string;
    period: string;
    assignedToId: string;
    assignedToType: 'Substitute' | 'Teacher' | 'Paraprofessional';
    subject: string;
    room: string;
    isEmergency?: boolean;
    notes?: string;
  }>;
  uncoveredPeriods: Array<{
    period: string;
    subject: string;
    room: string;
    reason: string;
  }>;
  constraintViolations: Array<{
    assignedToId: string;
    assignedToName: string;
    violationType: string;
    details: string;
  }>;
  emergencyOverrides: Array<{
    assignedToId: string;
    assignedToName: string;
    reason: string;
  }>;
}

export class NotificationService {
  
  // Main function to send all notifications after coverage assignment
  async sendCoverageNotifications(notificationData: CoverageNotificationData): Promise<void> {
    try {
      console.log('📬 Sending coverage notifications...');

      // Get absence details
      const absence = await prisma.absence.findUnique({
        where: { id: notificationData.absenceId },
        include: {
          teacher: true,
          school: true
        }
      });

      if (!absence) {
        console.error('❌ Absence not found for notifications');
        return;
      }

      const date = absence.date.toISOString().split('T')[0];

      // 1. Send assignment notifications to substitutes and teachers
      await this.sendAssignmentNotifications(notificationData.assignments, absence.teacher.name, date);

      // 2. Send admin alerts for uncovered periods
      if (notificationData.uncoveredPeriods.length > 0) {
        await this.sendUncoveredPeriodsAlert(notificationData.uncoveredPeriods, absence.teacher.name, date);
      }

      // 3. Send admin alerts for constraint violations
      if (notificationData.constraintViolations.length > 0) {
        await this.sendConstraintViolationAlerts(notificationData.constraintViolations, absence.teacher.name, date);
      }

      // 4. Send emergency override notifications
      if (notificationData.emergencyOverrides.length > 0) {
        await this.sendEmergencyOverrideNotifications(notificationData.emergencyOverrides, absence.teacher.name, date);
      }

      console.log('✅ All coverage notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending coverage notifications:', error);
    }
  }

  // Send notifications to assigned substitutes and teachers
  private async sendAssignmentNotifications(assignments: CoverageNotificationData['assignments'], teacherName: string, date: string): Promise<void> {
    for (const assignment of assignments) {
      try {
        let recipient: { name: string; email: string } | null = null;
        let assignmentType: 'substitute' | 'teacher' | 'emergency' = 'substitute';

        if (assignment.assignedToType === 'Substitute') {
          const substitute = await prisma.substitute.findUnique({
            where: { id: assignment.assignedToId }
          });
          if (substitute) {
            recipient = { name: substitute.name, email: substitute.email };
            assignmentType = 'substitute';
          }
        } else {
          const teacher = await prisma.user.findUnique({
            where: { id: assignment.assignedToId }
          });
          if (teacher) {
            recipient = { name: teacher.name, email: teacher.email };
            assignmentType = assignment.isEmergency ? 'emergency' : 'teacher';
          }
        }

        if (recipient) {
          const emailData: AssignmentEmailData = {
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            assignmentType,
            teacherName,
            date,
            periods: [assignment.period],
            subjects: [assignment.subject],
            rooms: [assignment.room],
            notes: assignment.notes,
            isEmergency: assignment.isEmergency
          };

          await emailService.sendAssignmentNotification(emailData);
          console.log(`📧 Assignment notification sent to ${recipient.name} (${recipient.email})`);
        }
      } catch (error) {
        console.error(`❌ Failed to send assignment notification for ${assignment.id}:`, error);
      }
    }
  }

  // Send admin alert for uncovered periods
  private async sendUncoveredPeriodsAlert(uncoveredPeriods: CoverageNotificationData['uncoveredPeriods'], teacherName: string, date: string): Promise<void> {
    const periods = uncoveredPeriods.map(p => p.period);
    const details = uncoveredPeriods.map(p => `${p.period}: ${p.subject} (${p.room}) - ${p.reason}`).join('; ');

    const alertData: AdminAlertData = {
      type: 'uncovered',
      teacherName,
      date,
      periods,
      details,
      severity: 'high'
    };

    await emailService.sendAdminAlert(alertData);
    console.log(`🚨 Uncovered periods alert sent for ${teacherName}`);
  }

  // Send admin alerts for constraint violations
  private async sendConstraintViolationAlerts(violations: CoverageNotificationData['constraintViolations'], teacherName: string, date: string): Promise<void> {
    for (const violation of violations) {
      const alertData: AdminAlertData = {
        type: 'constraint_violation',
        teacherName,
        date,
        periods: [], // Will be filled based on violation details
        details: `${violation.assignedToName}: ${violation.violationType} - ${violation.details}`,
        severity: 'medium'
      };

      await emailService.sendAdminAlert(alertData);
      console.log(`⚠️ Constraint violation alert sent for ${violation.assignedToName}`);
    }
  }

  // Send emergency override notifications
  private async sendEmergencyOverrideNotifications(overrides: CoverageNotificationData['emergencyOverrides'], teacherName: string, date: string): Promise<void> {
    for (const override of overrides) {
      // Send admin alert
      const alertData: AdminAlertData = {
        type: 'emergency_override',
        teacherName,
        date,
        periods: [],
        details: `Emergency override applied to ${override.assignedToName}: ${override.reason}`,
        severity: 'high'
      };

      await emailService.sendAdminAlert(alertData);
      console.log(`🚨 Emergency override alert sent for ${override.assignedToName}`);
    }
  }

  // Send daily summary to office staff and administrators
  async sendDailySummary(date: string, recipients: string[]): Promise<void> {
    try {
      console.log('📊 Generating daily summary...');

      const startDate = new Date(date + 'T00:00:00');
      const endDate = new Date(date + 'T23:59:59');

      // Get all absences for the date
      const absences = await prisma.absence.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          teacher: true,
          coverageAssignments: true
        }
      });

      // Get all coverage assignments for the date
      const coverageAssignments = await prisma.coverageAssignment.findMany({
        where: {
          absence: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          absence: {
            include: {
              teacher: true
            }
          }
        }
      });

      // Calculate summary statistics
      const totalAbsences = absences.length;
      let totalAssignments = 0;
      let uncoveredPeriods = 0;
      let emergencyOverrides = 0;

      const absenceDetails = absences.map(absence => {
        let assignmentCount = 0;
        let uncoveredCount = 0;
        
        const assignment = absence.coverageAssignments;
        if (assignment) {
          // Count assigned periods
          for (const period of ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']) {
            const periodField = `period${period}` as keyof typeof assignment;
            if (assignment[periodField]) {
              assignmentCount++;
              totalAssignments++;
            } else if (absence.periods && Array.isArray(absence.periods) && absence.periods.includes(period)) {
              uncoveredCount++;
              uncoveredPeriods++;
            }
          }
        }

        let coverageStatus = 'Fully Covered';
        if (uncoveredCount > 0 && assignmentCount > 0) {
          coverageStatus = 'Partially Covered';
        } else if (assignmentCount === 0) {
          coverageStatus = 'Uncovered';
        }

        // Convert JsonArray to string[] safely
        const periodsArray = Array.isArray(absence.periods) 
          ? absence.periods.map(p => String(p)) 
          : [];

        return {
          teacherName: absence.teacher.name,
          periods: periodsArray,
          coverageStatus
        };
      });

      const summaryData: DailySummaryData = {
        date,
        totalAbsences,
        totalAssignments,
        uncoveredPeriods,
        emergencyOverrides, // This would need to be tracked separately
        absenceDetails
      };

      await emailService.sendDailySummary(recipients, summaryData);
      console.log('✅ Daily summary sent successfully');
    } catch (error) {
      console.error('❌ Error sending daily summary:', error);
    }
  }

  // Utility function to send test notifications
  async sendTestNotification(recipientEmail: string): Promise<boolean> {
    try {
      const testData: AssignmentEmailData = {
        recipientName: 'Test User',
        recipientEmail,
        assignmentType: 'substitute',
        teacherName: 'John Smith',
        date: '2025-07-28',
        periods: ['3rd', '4th'],
        subjects: ['Math', 'Algebra'],
        rooms: ['Room 101', 'Room 102'],
        notes: 'This is a test notification from the PlanD system.'
      };

      return await emailService.sendAssignmentNotification(testData);
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
