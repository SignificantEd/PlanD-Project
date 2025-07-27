import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily-summary';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Map URL types to internal report types
    const reportTypeMap: { [key: string]: string } = {
      'dashboard': 'daily-summary',
      'daily-report': 'daily-summary',
      'staff-report': 'staff-utilization',
      'cost-report': 'cost-analysis',
      'admin-report': 'admin-actions'
    };

    const reportType = reportTypeMap[type] || 'daily-summary';
    const startDate = new Date(date);
    const endDate = new Date(date);

    let reportData: any = {};

    switch (reportType) {
      case 'daily-summary':
        reportData = await generateDailySummary(startDate, endDate);
        break;
      case 'staff-utilization':
        reportData = await generateStaffUtilization(startDate, endDate);
        break;
      case 'cost-analysis':
        reportData = await generateCostAnalysis(startDate, endDate);
        break;
      case 'admin-actions':
        reportData = await generateAdminActions(startDate, endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Generate CSV content
    const csvContent = generateCSV(reportData, reportType);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, dateRange, filters } = body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    let reportData: any = {};

    switch (reportType) {
      case 'daily-summary':
        reportData = await generateDailySummary(startDate, endDate);
        break;
      case 'staff-utilization':
        reportData = await generateStaffUtilization(startDate, endDate);
        break;
      case 'cost-analysis':
        reportData = await generateCostAnalysis(startDate, endDate);
        break;
      case 'admin-actions':
        reportData = await generateAdminActions(startDate, endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Generate CSV content
    const csvContent = generateCSV(reportData, reportType);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateDailySummary(startDate: Date, endDate: Date) {
  const absences = await prisma.absence.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      teacher: true,
      school: true,
      coverageAssignments: true,
    },
  });

  return absences.map(absence => {
    const assignments = Array.isArray(absence.coverageAssignments) ? absence.coverageAssignments : [];
    const periodsRequested = (absence.periods as string[]).length;
    const periodsCovered = assignments.length;
    
    return {
      date: absence.date.toISOString().split('T')[0],
      teacherName: absence.teacher.name,
      school: absence.school.name,
      absenceType: absence.absenceType,
      periodsRequested,
      periodsCovered,
      coverageRate: periodsRequested > 0 
        ? Math.round((periodsCovered / periodsRequested) * 100)
        : 0,
      notes: absence.notes,
    };
  });
}

async function generateStaffUtilization(startDate: Date, endDate: Date) {
  const assignments = await prisma.coverageAssignment.findMany({
    where: {
      absence: {
        date: {
          gte: startDate,
          lte: endDate,
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

  const substitutes = await prisma.substitute.findMany();
  
  return substitutes.map(sub => {
    let assignmentCount = 0;
    const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    
    assignments.forEach(assignment => {
      periods.forEach(period => {
        const periodField = `period${period}` as keyof typeof assignment;
        const typeField = `period${period}Type` as keyof typeof assignment;
        
        if (assignment[periodField] === sub.id && assignment[typeField] === 'Substitute') {
          assignmentCount++;
        }
      });
    });

    return {
      substituteName: sub.name,
      email: sub.email,
      totalAssignments: assignmentCount,
      isActive: true, // Default since field doesn't exist
      subjects: (sub.subjectSpecialties as any) || 'N/A', // Use existing field
      maxHoursPerDay: 8, // Default since field doesn't exist
    };
  });
}

async function generateCostAnalysis(startDate: Date, endDate: Date) {
  // Simplified cost analysis - would need actual rate data
  const assignments = await prisma.coverageAssignment.findMany({
    where: {
      absence: {
        date: {
          gte: startDate,
          lte: endDate,
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

  return assignments.map(assignment => ({
    date: assignment.absence.date.toISOString().split('T')[0],
    absentTeacher: assignment.absence.teacher.name,
    assignmentType: 'Substitute', // Simplified
    periodsAssigned: 1, // Simplified
    estimatedCost: 120, // Simplified rate
    notes: 'Estimated based on standard rates',
  }));
}

async function generateAdminActions(startDate: Date, endDate: Date) {
  // Simplified admin actions - would need actual audit log
  const assignments = await prisma.coverageAssignment.findMany({
    where: {
      absence: {
        date: {
          gte: startDate,
          lte: endDate,
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
  });

  return assignments.map(assignment => ({
    timestamp: assignment.createdAt.toISOString(),
    action: 'Assignment Created',
    adminUser: 'system',
    teacherName: assignment.absence.teacher.name,
    details: `Coverage assignment created for ${assignment.absence.teacher.name}`,
    status: 'Completed',
  }));
}

function generateCSV(data: any[], reportType: string): string {
  if (data.length === 0) {
    return 'No data available for the selected date range';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}
