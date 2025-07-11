import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, action, reason } = await request.json();

    if (!assignmentId || !action) {
      return NextResponse.json(
        { error: 'Assignment ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find the coverage assignment
    const assignment = await prisma.coverageAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        absence: {
          include: {
            teacher: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Update the assignment status
    const updateData: any = {
      status: action === 'approve' ? 'assigned' : 'rejected',
      notes: action === 'reject' && reason ? reason : assignment.notes
    };

    // Add approval/rejection metadata
    if (action === 'approve') {
      updateData.approvedAt = new Date();
      // In a real system, you'd get the current user's ID
      updateData.approvedBy = 'admin';
    } else {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = 'admin';
      updateData.rejectionReason = reason;
    }

    await prisma.coverageAssignment.update({
      where: { id: assignmentId },
      data: updateData
    });

    // Update the absence status if all assignments are processed
    const allAssignments = await prisma.coverageAssignment.findMany({
      where: { absenceId: assignment.absenceId }
    });

    const allApproved = allAssignments.every(a => a.status === 'assigned');
    const anyRejected = allAssignments.some(a => a.status === 'rejected');

    let absenceStatus = 'pending';
    if (allApproved) {
      absenceStatus = 'assigned';
    } else if (anyRejected) {
      absenceStatus = 'partially_assigned';
    }

    await prisma.absence.update({
      where: { id: assignment.absenceId },
      data: { status: absenceStatus }
    });

    // Log the action
    console.log(`Assignment ${action}d:`, {
      assignmentId,
      action,
      reason,
      teacherName: assignment.absence.teacher.name,
      date: assignment.absence.date
    });

    return NextResponse.json({
      success: true,
      message: `Assignment ${action}d successfully`,
      assignmentId,
      action
    });

  } catch (error) {
    console.error('Error processing assignment approval:', error);
    return NextResponse.json(
      { error: 'Failed to process assignment approval' },
      { status: 500 }
    );
  }
} 