import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all teachers with their master schedule
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      include: {
        masterSchedule: true
      }
    });

    // Generate CSV content
    const csvHeaders = [
      'Teacher_Name',
      'Department', 
      'Room',
      'Email',
      'Phone',
      'isPara',
      '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
      '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B',
      'Prep_Periods',
      'PLC_Periods', 
      'PD_Periods'
    ];

    let csvContent = csvHeaders.join(',') + '\n';

    for (const teacher of teachers) {
      // Group schedule by period
      const scheduleByPeriod: { [key: string]: string } = {};
      const prepPeriods: string[] = [];
      const plcPeriods: string[] = [];
      const pdPeriods: string[] = [];

      teacher.masterSchedule.forEach(entry => {
        if (entry.period) {
          scheduleByPeriod[entry.period] = entry.subject;
          
          // Track non-teaching periods
          if (entry.subject === 'Prep') {
            const periodNum = entry.period.replace(/[AB]$/, '');
            if (!prepPeriods.includes(periodNum)) {
              prepPeriods.push(periodNum);
            }
          } else if (entry.subject === 'PLC') {
            const periodNum = entry.period.replace(/[AB]$/, '');
            if (!plcPeriods.includes(periodNum)) {
              plcPeriods.push(periodNum);
            }
          } else if (entry.subject === 'PD') {
            const periodNum = entry.period.replace(/[AB]$/, '');
            if (!pdPeriods.includes(periodNum)) {
              pdPeriods.push(periodNum);
            }
          }
        }
      });

      // Build CSV row
      const row = [
        teacher.name,
        teacher.department || '',
        '', // Room - would need to be added to schema
        teacher.email,
        '', // Phone - would need to be added to schema
        'false', // isPara - would need to be determined
        scheduleByPeriod['1A'] || '',
        scheduleByPeriod['1B'] || '',
        scheduleByPeriod['2A'] || '',
        scheduleByPeriod['2B'] || '',
        scheduleByPeriod['3A'] || '',
        scheduleByPeriod['3B'] || '',
        scheduleByPeriod['4A'] || '',
        scheduleByPeriod['4B'] || '',
        scheduleByPeriod['5A'] || '',
        scheduleByPeriod['5B'] || '',
        scheduleByPeriod['6A'] || '',
        scheduleByPeriod['6B'] || '',
        scheduleByPeriod['7A'] || '',
        scheduleByPeriod['7B'] || '',
        scheduleByPeriod['8A'] || '',
        scheduleByPeriod['8B'] || '',
        prepPeriods.join(','),
        plcPeriods.join(','),
        pdPeriods.join(',')
      ];

      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="schedule-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to export schedule' },
      { status: 500 }
    );
  }
} 