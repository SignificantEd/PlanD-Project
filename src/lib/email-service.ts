import nodemailer from 'nodemailer';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AssignmentEmailData {
  recipientName: string;
  recipientEmail: string;
  assignmentType: 'substitute' | 'teacher' | 'emergency';
  teacherName: string;
  date: string;
  periods: string[];
  subjects: string[];
  rooms: string[];
  notes?: string;
  isEmergency?: boolean;
}

export interface AdminAlertData {
  type: 'uncovered' | 'constraint_violation' | 'emergency_override';
  teacherName: string;
  date: string;
  periods: string[];
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DailySummaryData {
  date: string;
  totalAbsences: number;
  totalAssignments: number;
  uncoveredPeriods: number;
  emergencyOverrides: number;
  absenceDetails: Array<{
    teacherName: string;
    periods: string[];
    coverageStatus: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    const provider = process.env.EMAIL_PROVIDER;

    if (provider === 'mailtrap') {
      // Development - Mailtrap
      this.transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: parseInt(process.env.MAILTRAP_PORT || '2525'),
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    } else if (provider === 'sendgrid') {
      // Production - SendGrid
      this.transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else {
      // Fallback - console logging for development
      console.log('📧 Email service configured for console logging (no provider set)');
      return;
    }

    // Verify connection
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
      }
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      this.transporter = null;
    }
  }

  private async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) {
      // Log to console instead if no transporter
      console.log('📧 EMAIL LOG:', {
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.text || 'HTML content provided'
      });
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // 📬 1. Assignment Notifications
  async sendAssignmentNotification(data: AssignmentEmailData): Promise<boolean> {
    const { recipientName, recipientEmail, assignmentType, teacherName, date, periods, subjects, rooms, notes, isEmergency } = data;

    let subject: string;
    let html: string;

    if (assignmentType === 'substitute') {
      subject = `Substitute Assignment - ${teacherName} (${date})`;
      html = this.generateSubstituteAssignmentEmail(data);
    } else if (assignmentType === 'teacher') {
      subject = isEmergency 
        ? `Emergency Coverage Assignment - ${teacherName} (${date})`
        : `Coverage Assignment - ${teacherName} (${date})`;
      html = this.generateTeacherAssignmentEmail(data);
    } else {
      subject = `Emergency Override Assignment - ${teacherName} (${date})`;
      html = this.generateEmergencyAssignmentEmail(data);
    }

    const text = `You have been assigned to cover for ${teacherName} on ${date} during periods: ${periods.join(', ')}. ${notes || ''}`;

    return await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text
    });
  }

  // ⚠️ 2. Admin Alerts
  async sendAdminAlert(data: AdminAlertData): Promise<boolean> {
    const { type, teacherName, date, periods, details, severity } = data;

    const priorityIcon = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
    
    let subject: string;
    switch (type) {
      case 'uncovered':
        subject = `${priorityIcon} Uncovered Periods Alert - ${teacherName} (${date})`;
        break;
      case 'constraint_violation':
        subject = `${priorityIcon} Constraint Violation - ${teacherName} (${date})`;
        break;
      case 'emergency_override':
        subject = `${priorityIcon} Emergency Override Applied - ${teacherName} (${date})`;
        break;
    }

    const html = this.generateAdminAlertEmail(data);
    const text = `Admin Alert: ${type} for ${teacherName} on ${date}. Periods: ${periods.join(', ')}. Details: ${details}`;

    return await this.sendEmail({
      to: process.env.EMAIL_ADMIN || 'admin@planD.local',
      subject,
      html,
      text
    });
  }

  // 📊 3. Daily Assignment Summaries
  async sendDailySummary(recipients: string[], data: DailySummaryData): Promise<boolean> {
    const { date, totalAbsences, totalAssignments, uncoveredPeriods, emergencyOverrides } = data;

    const subject = `Daily Coverage Summary - ${date}`;
    const html = this.generateDailySummaryEmail(data);
    const text = `Daily Summary for ${date}: ${totalAbsences} absences, ${totalAssignments} assignments, ${uncoveredPeriods} uncovered periods`;

    const results = await Promise.all(
      recipients.map(email => 
        this.sendEmail({
          to: email,
          subject,
          html,
          text
        })
      )
    );

    return results.every(result => result);
  }

  // Email template generators
  private generateSubstituteAssignmentEmail(data: AssignmentEmailData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>🎯 Substitute Assignment</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc;">
          <h2>Hello ${data.recipientName},</h2>
          
          <p>You have been assigned to substitute for <strong>${data.teacherName}</strong> on <strong>${data.date}</strong>.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>📋 Assignment Details:</h3>
            <ul>
              <li><strong>Date:</strong> ${data.date}</li>
              <li><strong>Period(s):</strong> ${data.periods.join(', ')}</li>
              <li><strong>Subject(s):</strong> ${data.subjects.join(', ')}</li>
              <li><strong>Room(s):</strong> ${data.rooms.join(', ')}</li>
              ${data.notes ? `<li><strong>Notes:</strong> ${data.notes}</li>` : ''}
            </ul>
          </div>
          
          <p>Please arrive 15 minutes early to review lesson plans and classroom procedures.</p>
          
          <p>If you have any questions, please contact the main office.</p>
          
          <p>Thank you for your service!</p>
        </div>
        
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message from PlanD Coverage System
        </div>
      </div>
    `;
  }

  private generateTeacherAssignmentEmail(data: AssignmentEmailData): string {
    const emergencyNotice = data.isEmergency ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 8px;">
        <h3 style="color: #dc2626; margin-top: 0;">🚨 Emergency Assignment</h3>
        <p style="color: #dc2626; margin-bottom: 0;">
          This is an emergency coverage assignment. We understand this may impact your preparation time, 
          and you will be compensated accordingly per district policy.
        </p>
      </div>
    ` : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1>📚 Coverage Assignment</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc;">
          <h2>Hello ${data.recipientName},</h2>
          
          <p>You have been assigned to provide coverage for <strong>${data.teacherName}</strong> on <strong>${data.date}</strong>.</p>
          
          ${emergencyNotice}
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>📋 Coverage Details:</h3>
            <ul>
              <li><strong>Date:</strong> ${data.date}</li>
              <li><strong>Period(s):</strong> ${data.periods.join(', ')}</li>
              <li><strong>Subject(s):</strong> ${data.subjects.join(', ')}</li>
              <li><strong>Room(s):</strong> ${data.rooms.join(', ')}</li>
              ${data.notes ? `<li><strong>Notes:</strong> ${data.notes}</li>` : ''}
            </ul>
          </div>
          
          <p>Please check with the absent teacher or department head for lesson plans and materials.</p>
          
          <p>Thank you for your flexibility and support!</p>
        </div>
        
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message from PlanD Coverage System
        </div>
      </div>
    `;
  }

  private generateEmergencyAssignmentEmail(data: AssignmentEmailData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🚨 Emergency Override Assignment</h1>
        </div>
        
        <div style="padding: 20px; background-color: #fef2f2;">
          <h2>Hello ${data.recipientName},</h2>
          
          <div style="background-color: #fee2e2; border: 2px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <h3 style="color: #dc2626; margin-top: 0;">Emergency Situation</h3>
            <p style="color: #dc2626;">
              Due to unforeseen circumstances and no other available coverage options, 
              you have been assigned despite your opt-out preference.
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>📋 Assignment Details:</h3>
            <ul>
              <li><strong>Teacher:</strong> ${data.teacherName}</li>
              <li><strong>Date:</strong> ${data.date}</li>
              <li><strong>Period(s):</strong> ${data.periods.join(', ')}</li>
              <li><strong>Subject(s):</strong> ${data.subjects.join(', ')}</li>
              <li><strong>Room(s):</strong> ${data.rooms.join(', ')}</li>
            </ul>
          </div>
          
          <div style="background-color: #dcfce7; border: 2px solid #16a34a; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <h3 style="color: #15803d; margin-top: 0;">💰 Compensation</h3>
            <p style="color: #15803d; margin-bottom: 0;">
              You will receive emergency coverage compensation as outlined in the district policy. 
              Please contact HR for details about additional compensation.
            </p>
          </div>
          
          <p>We sincerely appreciate your understanding and flexibility during this emergency situation.</p>
          
          <p>If you have any concerns, please contact administration immediately.</p>
        </div>
        
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message from PlanD Coverage System
        </div>
      </div>
    `;
  }

  private generateAdminAlertEmail(data: AdminAlertData): string {
    const severityColor = data.severity === 'high' ? '#dc2626' : data.severity === 'medium' ? '#d97706' : '#059669';
    const severityBg = data.severity === 'high' ? '#fef2f2' : data.severity === 'medium' ? '#fef3c7' : '#f0fdf4';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColor}; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Admin Alert</h1>
        </div>
        
        <div style="padding: 20px; background-color: ${severityBg};">
          <h2>Coverage System Alert</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>🔍 Alert Details:</h3>
            <ul>
              <li><strong>Alert Type:</strong> ${data.type.replace('_', ' ').toUpperCase()}</li>
              <li><strong>Teacher:</strong> ${data.teacherName}</li>
              <li><strong>Date:</strong> ${data.date}</li>
              <li><strong>Affected Periods:</strong> ${data.periods.join(', ')}</li>
              <li><strong>Severity:</strong> ${data.severity.toUpperCase()}</li>
            </ul>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>📝 Additional Details:</h3>
            <p>${data.details}</p>
          </div>
          
          <p>Please review the PlanD dashboard for more information and take appropriate action.</p>
        </div>
        
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message from PlanD Coverage System
        </div>
      </div>
    `;
  }

  private generateDailySummaryEmail(data: DailySummaryData): string {
    const absenceRows = data.absenceDetails.map(absence => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${absence.teacherName}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${absence.periods.join(', ')}</td>
        <td style="padding: 8px; border: 1px solid #e5e7eb;">${absence.coverageStatus}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
          <h1>📊 Daily Coverage Summary</h1>
          <h2>${data.date}</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #1e40af;">Total Absences</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #1e40af;">${data.totalAbsences}</p>
            </div>
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #15803d;">Assignments Made</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #15803d;">${data.totalAssignments}</p>
            </div>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #d97706;">Uncovered Periods</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #d97706;">${data.uncoveredPeriods}</p>
            </div>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #dc2626;">Emergency Overrides</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #dc2626;">${data.emergencyOverrides}</p>
            </div>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3>📋 Absence Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Teacher</th>
                  <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Periods</th>
                  <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Coverage Status</th>
                </tr>
              </thead>
              <tbody>
                ${absenceRows}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated message from PlanD Coverage System
        </div>
      </div>
    `;
  }
}

// Export a singleton instance
export const emailService = new EmailService();
