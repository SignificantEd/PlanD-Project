import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IRecentActivity } from '../../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get recent absences
    const recentAbsences = await prisma.absence.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: true
      }
    });

    // Get recent coverage assignments
    const recentAssignments = await prisma.coverageAssignment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        absence: {
          include: {
            teacher: true
          }
        }
      }
    });

    // Combine and format activities
    const activities: IRecentActivity[] = [];

    // Add absence activities
    recentAbsences.forEach(absence => {
      activities.push({
        id: `absence-${absence.id}`,
        type: 'absence_reported',
        description: `${absence.teacher.name} absence reported`,
        timestamp: absence.createdAt,
        userId: absence.teacherId,
        userName: absence.teacher.name,
        relatedId: absence.id
      });
    });

    // Add assignment activities
    recentAssignments.forEach(assignment => {
      if (assignment.status === 'assigned') {
        activities.push({
          id: `assignment-${assignment.id}`,
          type: 'coverage_assigned',
          description: `Coverage assigned for ${assignment.absence.teacher.name}`,
          timestamp: assignment.createdAt,
          relatedId: assignment.id
        });
      }
    });

    // Sort by timestamp (most recent first) and take top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
} 