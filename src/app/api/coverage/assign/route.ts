import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { assignCoverageForDate } from '@/lib/enterprise-coverage-algorithm';

const prisma = new PrismaClient();

// Helper: get today's date as a string
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function POST() {
  try {
    console.log('🚀 Starting coverage assignment process...');
    
    // 1. Get today's date
    const today = getToday();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`📅 Processing assignments for ${todayStr} (${dayOfWeek})`);

    // 2. Check if there are any pending absences for today
    const absences = await prisma.absence.findMany({
      where: {
        date: today,
        status: 'pending'
      },
      include: {
        teacher: true,
      },
    });
    
    console.log(`📋 Found ${absences.length} pending absences for today`);
    
    if (!absences.length) {
      console.log('❌ No pending absences found for today');
      return NextResponse.json({ 
        message: 'No pending absences found for today.',
        assignments: [],
        coverageResults: []
      });
    }

    // 3. Run the enterprise coverage assignment algorithm
    console.log('🔧 Calling enterprise coverage algorithm...');
    const result = await assignCoverageForDate(prisma, todayStr, 'A');
    
    console.log('✅ Coverage assignment completed');
    console.log(`📊 Results: ${result.assignments.length} assignments created, ${result.coverageResults.length} coverage results`);

    // 4. Return the results
    return NextResponse.json({
      message: 'Coverage assignment completed successfully',
      assignments: result.assignments,
      coverageResults: result.coverageResults,
      totalCandidatesEvaluated: result.totalCandidatesEvaluated,
      processingTime: result.processingTime,
      date: todayStr
    });
    
  } catch (error) {
    console.error('❌ Error assigning coverage:', error);
    return NextResponse.json({ 
      error: 'Failed to assign coverage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 