import { NextRequest, NextResponse } from 'next/server';
import { emailService, AssignmentEmailData, AdminAlertData, DailySummaryData } from '../../../lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let result: boolean = false;

    switch (type) {
      case 'assignment':
        result = await emailService.sendAssignmentNotification(data as AssignmentEmailData);
        break;
      
      case 'admin_alert':
        result = await emailService.sendAdminAlert(data as AdminAlertData);
        break;
      
      case 'daily_summary':
        const { recipients, summaryData } = data;
        result = await emailService.sendDailySummary(recipients, summaryData as DailySummaryData);
        break;
      
      case 'test':
        // Send a test email
        const testData: AssignmentEmailData = {
          recipientName: data.recipientName || 'Test User',
          recipientEmail: data.recipientEmail,
          assignmentType: 'substitute',
          teacherName: 'John Smith',
          date: '2025-07-28',
          periods: ['3rd', '4th'],
          subjects: ['Math', 'Algebra'],
          rooms: ['Room 101', 'Room 102'],
          notes: 'This is a test email from the PlanD notification system.'
        };
        result = await emailService.sendAssignmentNotification(testData);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET endpoint to test email configuration
export async function GET() {
  try {
    const config = {
      provider: process.env.EMAIL_PROVIDER || 'none',
      fromEmail: process.env.EMAIL_FROM || 'not configured',
      adminEmail: process.env.EMAIL_ADMIN || 'not configured',
      status: process.env.EMAIL_PROVIDER ? 'configured' : 'not configured'
    };

    return NextResponse.json({
      emailConfig: config,
      message: 'Email configuration status'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get email configuration' },
      { status: 500 }
    );
  }
}
