import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IApprovalQueueItem } from '../../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all coverage assignments that need approval (status: 'assigned')
    const pendingAssignments = await prisma.coverageAssignment.findMany({
      where: {
        status: 'assigned' // These are assignments that need approval
      },
      include: {
        absence: {
          include: {
            teacher: true
          }
        }
      }
    });

    // Convert to approval queue items
    const approvalQueueItems: IApprovalQueueItem[] = [];
    
    for (const assignment of pendingAssignments) {
      // Extract period assignments
      const periodAssignments = [
        { period: '1st', assignedToId: assignment.period1st },
        { period: '2nd', assignedToId: assignment.period2nd },
        { period: '3rd', assignedToId: assignment.period3rd },
        { period: '4th', assignedToId: assignment.period4th },
        { period: '5th', assignedToId: assignment.period5th },
        { period: '6th', assignedToId: assignment.period6th },
        { period: '7th', assignedToId: assignment.period7th },
        { period: '8th', assignedToId: assignment.period8th },
      ].filter(p => p.assignedToId); // Only include periods with assignments

      for (const periodAssignment of periodAssignments) {
        // Get substitute name
        let assignedToName = 'Unknown';
        try {
          if (periodAssignment.assignedToId) {
            const substitute = await prisma.substitute.findUnique({
              where: { id: periodAssignment.assignedToId }
            });
            if (substitute) {
              assignedToName = substitute.name;
            }
          }
        } catch (error) {
          console.log('Could not find substitute for ID:', periodAssignment.assignedToId);
        }

        const mockAssignment = {
          id: `${assignment.id}-${periodAssignment.period}`,
          absenceId: assignment.absenceId,
          absentTeacherId: assignment.absence.teacherId,
          absentTeacherName: assignment.absence.teacher.name,
          period: periodAssignment.period,
          assignedToId: periodAssignment.assignedToId || '',
          assignedToName,
          assignmentType: 'External Sub' as const,
          date: assignment.absence.date instanceof Date ? assignment.absence.date.toISOString().split('T')[0] : assignment.absence.date,
          status: 'assigned' as const,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        };

        const mockAbsence = {
          id: assignment.absence.id,
          teacherId: assignment.absence.teacherId,
          absentTeacherName: assignment.absence.teacher.name,
          date: assignment.absence.date instanceof Date ? assignment.absence.date.toISOString().split('T')[0] : assignment.absence.date,
          dayType: 'A' as const,
          type: 'Full Day' as const,
          periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
          periodsToCover: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
          status: 'Pending' as const,
          manualOverride: {},
          priority: 2,
          createdAt: assignment.absence.createdAt,
          updatedAt: assignment.absence.updatedAt
        };

        const mockTeacher = {
          id: assignment.absence.teacher.id,
          name: assignment.absence.teacher.name,
          department: assignment.absence.teacher.department || '',
          email: assignment.absence.teacher.email,
          phone: '',
          schedule: {},
          assignedCoverageCount: 0,
          isInternal: true,
          isPara: false,
          maxLoad: 6,
          maxWeeklyLoad: 30,
          createdAt: assignment.absence.teacher.createdAt,
          updatedAt: assignment.absence.teacher.updatedAt
        };

        approvalQueueItems.push({
          assignment: mockAssignment,
          absence: mockAbsence,
          teacher: mockTeacher
        });
      }
    }

    return NextResponse.json(approvalQueueItems);
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval queue' },
      { status: 500 }
    );
  }
} 