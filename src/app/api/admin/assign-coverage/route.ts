import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { assignCoverageForDate } from '../../../../lib/enterprise-coverage-algorithm';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { date, dayType } = await request.json();

    // Debug logging
    console.log('Assign Coverage API Debug:', {
      receivedDate: date,
      receivedDayType: dayType,
      dateType: typeof date,
      dateRegexTest: /^\d{4}-\d{2}-\d{2}$/.test(date)
    });

    if (!date || !dayType) {
      return NextResponse.json(
        { error: 'Date and dayType are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date value.' },
        { status: 400 }
      );
    }

    // Validate dayType
    if (!['A', 'B'].includes(dayType)) {
      return NextResponse.json(
        { error: 'DayType must be either A or B' },
        { status: 400 }
      );
    }

    // Check if it's a weekend
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: 'Coverage assignment is not available for weekends' },
        { status: 400 }
      );
    }

    console.log('Starting coverage assignment for:', { date, dayType, dayOfWeek });

    // Run the enterprise coverage algorithm
    const result = await assignCoverageForDate(prisma, date, dayType);

    // Log the results
    console.log(`Coverage assignment completed for ${date} (Day ${dayType}):`, {
      assignments: result.assignments.length,
      coverageResults: result.coverageResults.length,
      candidatesEvaluated: result.totalCandidatesEvaluated,
      processingTime: result.processingTime
    });

    return NextResponse.json({
      success: true,
      message: `Coverage assignment completed successfully`,
      date,
      dayType,
      assignments: result.assignments,
      coverageResults: result.coverageResults,
      totalCandidatesEvaluated: result.totalCandidatesEvaluated,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Error assigning coverage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to assign coverage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 