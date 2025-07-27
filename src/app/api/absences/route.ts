import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to normalize period format
function normalizePeriod(period: string): string {
  // Convert "Period 1" format to "1st" format
  const match = period.match(/period\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const suffixes = ['', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${num}${suffixes[num] || 'th'}`;
  }
  return period;
}

export async function GET() {
  try {
    const absences = await prisma.absence.findMany({
      include: {
        teacher: true,
        school: true,
        coverageAssignments: true
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Resolve substitute information for coverage assignments
    const absencesWithResolvedCoverage = await Promise.all(absences.map(async (absence: any) => {
      if (absence.coverageAssignments && Array.isArray(absence.coverageAssignments) && absence.coverageAssignments.length > 0) {
        const resolvedAssignments = await Promise.all(absence.coverageAssignments.map(async (assignment: any) => {
          const resolvedAssignment: any = { ...assignment };
          
          // For each period, check if it's assigned to a substitute and resolve the substitute info
          for (const period of ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']) {
            const periodField = `period${period}` as keyof typeof assignment;
            const periodTypeField = `period${period}Type` as keyof typeof assignment;
            
            if (assignment[periodField] && assignment[periodTypeField] === 'Substitute') {
              // This is a substitute assignment, resolve the substitute info
              const substitute = await prisma.substitute.findUnique({
                where: { id: assignment[periodField] as string }
              });
              
              if (substitute) {
                resolvedAssignment[`assignedSubstitute${period}`] = substitute;
                resolvedAssignment[`assignedTeacher${period}`] = null;
              }
            } else if (assignment[periodField] && assignment[periodTypeField] !== 'Substitute') {
              // This is a teacher or paraprofessional assignment
              resolvedAssignment[`assignedTeacher${period}`] = { name: assignment[periodField] };
              resolvedAssignment[`assignedSubstitute${period}`] = null;
            }
          }
          
          return resolvedAssignment;
        }));
        
        return {
          ...absence,
          coverageAssignments: resolvedAssignments
        };
      }
      
      return absence;
    }));

    return NextResponse.json(absencesWithResolvedCoverage);
  } catch (error) {
    console.error('Error fetching absences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch absences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[DEBUG] Absence POST body:', JSON.stringify(body, null, 2));
    const { teacherId, schoolId, date, absenceType, notes, periods, periodsToCover } = body;

    // Validate required fields
    if (!teacherId || !schoolId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prevent duplicate absences for the same teacher and date
    const existing = await prisma.absence.findFirst({
      where: {
        teacherId,
        date: new Date(date + "T00:00:00"),
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This teacher already has an absence reported for this date.' },
        { status: 400 }
      );
    }

    // Backend validation: Only allow teaching periods from master schedule
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(date).getDay()];
    const msEntries = await prisma.masterSchedule.findMany({
      where: { 
        teacherId, 
        isTeaching: true 
      },
    });
    const validPeriods = msEntries.map((ms: any) => String(ms.period));

    // Backend logic: determine periods based on absenceType
    let filteredPeriods: string[] = [];
    if (absenceType === 'Half Day AM') {
      filteredPeriods = validPeriods.filter((p: string) => {
        const num = parseInt((p.match(/\d+/) || [''])[0], 10);
        return num >= 1 && num <= 4;
      });
    } else if (absenceType === 'Half Day PM') {
      filteredPeriods = validPeriods.filter((p: string) => {
        const num = parseInt((p.match(/\d+/) || [''])[0], 10);
        return num >= 5 && num <= 8;
      });
    } else if (absenceType === 'Custom') {
      filteredPeriods = (periods || []).filter((p: string) => validPeriods.includes(String(p)));
    } else {
      filteredPeriods = validPeriods; // Full day or other
    }

    // Determine periodsToCover: use provided or fallback to filteredPeriods
    const periodsToCoverFinal: string[] = Array.isArray(periodsToCover)
      ? periodsToCover.filter((p: string) => validPeriods.includes(String(p)))
      : filteredPeriods;

    // Create the absence record with validated periods
    const absence = await prisma.absence.create({
      data: {
        teacherId,
        schoolId,
        date: new Date(date + "T00:00:00"),
        absenceType,
        notes: notes || '',
        periods: filteredPeriods,
      },
      include: {
        teacher: true,
        school: true,
      },
    });

    // Automatically run the algorithm to create coverage assignments for this absence
    try {
      // Import the algorithm function
      const { assignCoverageForDate } = await import('../../../lib/enterprise-coverage-algorithm');
      
      console.log(`🤖 Auto-running algorithm for ${absence.teacher.name} on ${date}...`);
      
      // Run the algorithm for this specific date (requires prisma, date, dayType)
      const result = await assignCoverageForDate(prisma, date, 'A');
      
      console.log(`✅ Algorithm completed for ${absence.teacher.name}:`, {
        totalAssignments: result.assignments?.length || 0,
        totalCandidatesEvaluated: result.totalCandidatesEvaluated,
        processingTime: result.processingTime
      });
      
      if (result.assignments && result.assignments.length > 0) {
        console.log(`📋 ${result.assignments.length} coverage assignments created - should appear in approval queue!`);
        
        // Send email notifications to assigned staff
        try {
          const { NotificationService } = await import('../../../lib/notification-service');
          const notificationService = new NotificationService();
          
          // Use the notificationData from the algorithm result
          if (result.notificationData) {
            await notificationService.sendCoverageNotifications(result.notificationData);
            console.log(`📬 Email notifications sent to assigned staff`);
          } else {
            console.log(`⚠️ No notification data available`);
          }
        } catch (notificationError: any) {
          console.error('❌ Failed to send email notifications:', notificationError);
          // Continue anyway - the assignments were created successfully
        }
      } else {
        console.log(`⚠️ Algorithm completed but no assignments were created`);
      }
      
    } catch (algorithmError: any) {
      console.error('❌ Failed to auto-run algorithm:', algorithmError);
      console.error('Algorithm error details:', {
        name: algorithmError?.name || 'Unknown',
        message: algorithmError?.message || 'No message',
        stack: algorithmError?.stack || 'No stack trace'
      });
      // Continue anyway - the absence was created successfully
    }

    return NextResponse.json({
      message: 'Absence created successfully',
      absence
    }, { status: 201 });

  } catch (error) {
    console.error('[ERROR] Failed to create absence:', error);
    if (error instanceof Error && error.stack) {
      console.error('[ERROR STACK]', error.stack);
    }
    return NextResponse.json(
      { error: (error instanceof Error && error.message) ? error.message : 'Failed to create absence' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing absence ID' }, { status: 400 });
    }
    const updated = await prisma.absence.update({
      where: { id },
      data: updateFields,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating absence:', error);
    return NextResponse.json({ error: 'Failed to update absence' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing absence ID' }, { status: 400 });
    }
    await prisma.absence.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting absence:', error);
    return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
  }
} 