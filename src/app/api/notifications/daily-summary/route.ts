import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../../lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, recipients } = body;

    if (!date || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Date and recipients array are required' },
        { status: 400 }
      );
    }

    // Send daily summary
    await notificationService.sendDailySummary(date, recipients);

    return NextResponse.json({
      success: true,
      message: `Daily summary sent to ${recipients.length} recipients`,
      date,
      recipients
    });

  } catch (error) {
    console.error('Error sending daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to send daily summary' },
      { status: 500 }
    );
  }
}

// GET endpoint to test summary data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // This would normally call the notification service to get summary data
    // For now, return basic info
    return NextResponse.json({
      date,
      message: 'Use POST to send daily summary email',
      example: {
        date: "2025-07-26",
        recipients: ["admin@school.edu", "office@school.edu"]
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get daily summary info' },
      { status: 500 }
    );
  }
}
