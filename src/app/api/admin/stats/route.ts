import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { IDashboardStats } from '../../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all absences for today
    const absences = await prisma.absence.findMany({
      where: { 
        date: new Date(today)
      },
      include: {
        teacher: true
      }
    });

    // Get all coverage assignments for today
    const coverageAssignments = await prisma.coverageAssignment.findMany({
      where: {
        absence: {
          date: new Date(today)
        }
      }
    });

    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' }
    });

    // Get all substitutes
    const substitutes = await prisma.substitute.findMany();

    // Calculate statistics
    const teachersAbsent = absences.length;
    
    // Calculate total periods to cover
    let periodsToCover = 0;
    absences.forEach(absence => {
      if (absence.periods) {
        const periods = Array.isArray(absence.periods) 
          ? absence.periods 
          : JSON.parse(absence.periods as string);
        periodsToCover += periods.length;
      }
    });

    // Calculate assignments made
    let assignmentsMade = 0;
    coverageAssignments.forEach(assignment => {
      // Count non-null period assignments
      for (let i = 1; i <= 8; i++) {
        const periodKey = `period${i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : `${i}th`}` as keyof typeof assignment;
        if (assignment[periodKey]) {
          assignmentsMade++;
        }
      }
    });

    // Calculate time saved (estimate: 5 minutes per assignment)
    const timeSaved = assignmentsMade * 5;

    // Calculate pending approvals
    const pendingApprovals = coverageAssignments.filter(ca => ca.status === 'unassigned').length;

    // Calculate coverage rate
    const totalPeriods = periodsToCover;
    const coveredPeriods = assignmentsMade;
    const coverageRate = totalPeriods > 0 ? (coveredPeriods / totalPeriods) * 100 : 0;

    const stats: IDashboardStats = {
      teachersAbsent,
      periodsToCover,
      assignmentsMade,
      timeSaved,
      pendingApprovals,
      totalSubstitutes: substitutes.length,
      totalTeachers: teachers.length,
      coverageRate,
      coveredPeriods,
      totalPeriods
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 