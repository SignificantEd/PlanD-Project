import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🧹 Starting complete absence clearing...');
    
    // Delete substitute attendance records first
    const deletedAttendance = await prisma.substituteAttendance.deleteMany({});
    console.log(`Deleted ${deletedAttendance.count} substitute attendance records`);
    
    // Delete all coverage assignments next (due to foreign key constraints)
    const deletedCoverage = await prisma.coverageAssignment.deleteMany({});
    console.log(`Deleted ${deletedCoverage.count} coverage assignments`);
    
    // Then delete all absences
    const deletedAbsences = await prisma.absence.deleteMany({});
    console.log(`Deleted ${deletedAbsences.count} absences`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'All absences, coverage assignments, and attendance records have been cleared.',
      deleted: {
        substituteAttendance: deletedAttendance.count,
        coverageAssignments: deletedCoverage.count,
        absences: deletedAbsences.count
      }
    });
  } catch (error) {
    console.error('Error clearing absences:', error);
    return NextResponse.json(
      { error: 'Failed to clear absences' },
      { status: 500 }
    );
  }
} 