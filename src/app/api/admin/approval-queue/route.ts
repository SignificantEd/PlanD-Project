import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IApprovalQueueItem } from '../../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all coverage assignments that need approval
    const pendingAssignments = await prisma.coverageAssignment.findMany({
      where: {
        status: 'unassigned' // This would be updated to 'pending_approval' in the new system
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
    const approvalQueueItems: IApprovalQueueItem[] = pendingAssignments.map(assignment => {
      // Create a mock assignment object for now
      const mockAssignment = {
        id: assignment.id,
        absenceId: assignment.absenceId,
        absentTeacherId: assignment.absence.teacherId,
        absentTeacherName: assignment.absence.teacher.name,
        period: '1st', // This would be extracted from the assignment
        assignedToId: assignment.period1st || '',
        assignedToName: assignment.period1st || 'Unassigned',
        assignmentType: 'External Sub' as const,
        date: assignment.absence.date instanceof Date ? assignment.absence.date.toISOString().split('T')[0] : assignment.absence.date,
        status: 'Pending Approval' as const,
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

      return {
        assignment: mockAssignment,
        absence: mockAbsence,
        teacher: mockTeacher
      };
    });

    return NextResponse.json(approvalQueueItems);
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval queue' },
      { status: 500 }
    );
  }
} 