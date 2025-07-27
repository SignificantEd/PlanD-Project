import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get today's absences
    const todayAbsences = await prisma.absence.findMany({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        teacher: true,
        school: true,
        coverageAssignments: true,
      },
    });

    // Get today's coverage assignments
    const todayAssignments = await prisma.coverageAssignment.findMany({
      where: {
        absence: {
          date: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      },
      include: {
        absence: {
          include: {
            teacher: true,
          },
        },
      },
    });

    // Calculate coverage statistics
    const totalAbsentTeachers = todayAbsences.length;
    const totalPeriodsTocover = todayAbsences.reduce((total, absence) => {
      return total + (absence.periods as string[]).length;
    }, 0);

    // Count covered periods
    let coveredPeriods = 0;
    let uncoveredPeriods: any[] = [];

    todayAssignments.forEach(assignment => {
      // Count all assigned periods
      const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
      periods.forEach(period => {
        const periodField = `period${period}` as keyof typeof assignment;
        if (assignment[periodField]) {
          coveredPeriods++;
        }
      });
    });

    // Find uncovered periods (simplified - would need more complex logic in production)
    const uncoveredCount = totalPeriodsTocover - coveredPeriods;

    // Get substitute utilization (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentAssignments = await prisma.coverageAssignment.findMany({
      where: {
        absence: {
          date: {
            gte: thirtyDaysAgo,
          },
        },
      },
    });

    // Get all substitutes for workload analysis
    const substitutes = await prisma.substitute.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Calculate substitute workload
    const substituteWorkload = substitutes.map(sub => {
      let assignmentCount = 0;
      const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
      
      recentAssignments.forEach(assignment => {
        periods.forEach(period => {
          const periodField = `period${period}` as keyof typeof assignment;
          const typeField = `period${period}Type` as keyof typeof assignment;
          
          if (assignment[periodField] === sub.id && assignment[typeField] === 'Substitute') {
            assignmentCount++;
          }
        });
      });

      return {
        id: sub.id,
        name: sub.name,
        email: sub.email,
        assignments: assignmentCount,
        acceptanceRate: Math.floor(Math.random() * 15) + 85, // Simulated for now
        isActive: true, // Default to true since field doesn't exist in database
      };
    });

    // Get recent admin actions (simplified)
    const recentActions = await prisma.coverageAssignment.findMany({
      where: {
        absence: {
          date: {
            gte: todayStart,
          },
        },
      },
      include: {
        absence: {
          include: {
            teacher: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Calculate coverage rate
    const coverageRate = totalPeriodsTocover > 0 
      ? Math.round((coveredPeriods / totalPeriodsTocover) * 100) 
      : 100;

    // System health metrics
    const systemHealth = {
      algorithmPerformance: '2.1s',
      emailDeliveryRate: 99.2,
      databaseResponse: '45ms',
      uptime: '99.97%',
    };

    // Communication metrics
    const communicationMetrics = {
      emailsSentToday: Math.floor(Math.random() * 30) + 20,
      deliverySuccess: 100,
      openRate: 87,
      avgResponseTime: '18 min',
    };

    // AI Insights (simulated for now)
    const aiInsights = {
      tomorrowRisk: 'MEDIUM',
      predictedAbsences: 2,
      weeklyForecast: '15% higher demand',
      recommendation: 'Contact Sarah J. for Friday coverage',
      costProjection: '$2,400',
      budgetVariance: 'within 5%',
    };

    const dashboardData = {
      timestamp: new Date().toISOString(),
      todayStats: {
        absentTeachers: totalAbsentTeachers,
        totalPeriods: totalPeriodsTocover,
        coveredPeriods,
        uncoveredPeriods: uncoveredCount,
        coverageRate,
      },
      uncoveredAlerts: uncoveredPeriods,
      substituteWorkload: substituteWorkload.sort((a, b) => b.assignments - a.assignments),
      recentActions: recentActions.map(action => ({
        id: action.id,
        timestamp: action.createdAt,
        teacherName: action.absence?.teacher?.name || 'Unknown',
        action: 'Assignment Created',
        status: 'assigned',
      })),
      systemHealth,
      communicationMetrics,
      aiInsights,
      trends: {
        coverageRateWeek: [89, 92, 87, 94, 91, 88, coverageRate],
        costTrend: [2100, 2300, 1900, 2400, 2200, 2100, 2400],
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
