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

    // The assignmentId might be a composite ID like "coverageId-period"
    // Extract the actual coverage assignment ID
    let coverageAssignmentId = assignmentId;
    if (assignmentId.includes('-')) {
      coverageAssignmentId = assignmentId.split('-')[0];
    }

    // Find the coverage assignment
    const assignment = await prisma.coverageAssignment.findUnique({
      where: { id: coverageAssignmentId },
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
        { error: `Assignment not found for ID: ${assignmentId} (coverage ID: ${coverageAssignmentId})` },
        { status: 404 }
      );
    }

    // Update the assignment status - use the correct coverage assignment ID
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    // Add rejection reason to notes if rejecting
    if (action === 'reject' && reason) {
      updateData.notes = reason;
    }

    const updatedAssignment = await prisma.coverageAssignment.update({
      where: { id: coverageAssignmentId }, // Use the extracted coverage assignment ID
      data: updateData
    });

    // Update the absence status if all assignments are processed
    const allAssignments = await prisma.coverageAssignment.findMany({
      where: { absenceId: assignment.absenceId }
    });

    const allApproved = allAssignments.every(a => a.status === 'approved');
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
      coverageAssignmentId,
      action,
      reason,
      teacherName: assignment.absence.teacher.name,
      date: assignment.absence.date
    });

    return NextResponse.json({
      success: true,
      message: `Assignment ${action}d successfully`,
      assignmentId: assignmentId,
      coverageAssignmentId: coverageAssignmentId,
      newStatus: updatedAssignment.status,
      absenceStatus: absenceStatus
    });

  } catch (error) {
    console.error('Error approving/rejecting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to process assignment' },
      { status: 500 }
    );
  }
} 