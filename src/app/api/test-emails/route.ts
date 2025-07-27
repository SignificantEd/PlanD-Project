import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail } = await request.json();
    
    if (!recipientEmail) {
      return NextResponse.json({ error: 'recipientEmail is required' }, { status: 400 });
    }

    // Test substitute assignment notification
    const assignmentResult = await emailService.sendAssignmentNotification({
      recipientName: 'Test Substitute',
      recipientEmail: recipientEmail,
      assignmentType: 'substitute',
      teacherName: 'A. Smith',
      date: '2025-07-31',
      periods: ['3rd', '4th'],
      subjects: ['Mathematics', 'Algebra II'],
      rooms: ['Room 201', 'Room 201'],
      notes: 'This is a test notification from the PlanD system.',
      isEmergency: false
    });

    // Test admin alert
    const alertResult = await emailService.sendAdminAlert({
      type: 'uncovered',
      teacherName: 'B. Johnson',
      date: '2025-07-31',
      periods: ['5th'],
      details: 'No suitable substitute or internal teacher found for Biology class',
      severity: 'high'
    });

    // Test daily summary
    const summaryResult = await emailService.sendDailySummary([recipientEmail], {
      date: '2025-07-31',
      totalAbsences: 3,
      totalAssignments: 8,
      uncoveredPeriods: 1,
      emergencyOverrides: 0,
      absenceDetails: [
        {
          teacherName: 'A. Smith',
          periods: ['3rd', '4th'],
          coverageStatus: 'Fully Covered'
        },
        {
          teacherName: 'B. Johnson',
          periods: ['5th'],
          coverageStatus: 'Uncovered'
        },
        {
          teacherName: 'C. Williams',
          periods: ['1st', '2nd'],
          coverageStatus: 'Fully Covered'
        }
      ]
    });

    return NextResponse.json({
      success: true,
      results: {
        assignmentNotification: assignmentResult,
        adminAlert: alertResult,
        dailySummary: summaryResult
      },
      message: 'Test emails sent successfully'
    });

  } catch (error) {
    console.error('Error sending test emails:', error);
    return NextResponse.json(
      { error: 'Failed to send test emails' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Test Endpoint',
    usage: 'POST with { "recipientEmail": "test@example.com" }'
  });
}
