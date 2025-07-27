import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get uncovered periods that need immediate attention
    const uncoveredPeriods = await prisma.absence.findMany({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        teacher: true,
        school: true,
        coverageAssignments: true,
      },
    });

    // Process uncovered periods (simplified logic)
    const alerts = uncoveredPeriods.flatMap(absence => {
      const periods = absence.periods as string[];
      const assignments = Array.isArray(absence.coverageAssignments) ? absence.coverageAssignments : [];
      
      // Find periods without coverage
      const uncovered = periods.filter(period => {
        const hasAssignment = assignments.some((assignment: any) => {
          const periodIndex = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].indexOf(period);
          if (periodIndex !== -1) {
            const periodField = `period${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][periodIndex]}` as keyof typeof assignment;
            return assignment[periodField];
          }
          return false;
        });
        return !hasAssignment;
      });

      return uncovered.map(period => ({
        id: `${absence.id}-${period}`,
        absenceId: absence.id,
        teacherName: absence.teacher.name,
        period,
        subject: 'TBD', // Would need to look up from master schedule
        room: 'TBD', // Would need to look up from master schedule
        priority: 'HIGH',
        reason: 'No substitute available',
        timestamp: new Date().toISOString(),
      }));
    });

    return NextResponse.json({
      alerts,
      count: alerts.length,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Alerts API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    // Handle alert actions (assign substitute, override, etc.)
    // This would integrate with your existing assignment logic

    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} processed with action: ${action}`,
    });
  } catch (error) {
    console.error('Alert Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}
