import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TeacherRecord {
  Teacher_Name: string;
  Department: string;
  Room: string;
  Email: string;
  Phone: string;
  isPara: string;
  "1A": string;
  "1B": string;
  "2A": string;
  "2B": string;
  "3A": string;
  "3B": string;
  "4A": string;
  "4B": string;
  "5A": string;
  "5B": string;
  "6A": string;
  "6B": string;
  "7A": string;
  "7B": string;
  "8A": string;
  "8B": string;
  Prep_Periods: string;
  PLC_Periods: string;
  PD_Periods: string;
  [key: string]: string; // Allow string indexing
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const isExport = request.nextUrl.searchParams.get('export') === 'true';
    const schedules = await prisma.masterSchedule.findMany({
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
            department: true,
          }
        },
        school:{
          select: {
            name: true,
          }
        },
        periodConfig: {
          select: {
            label: true,
            type: true,
          }
        }
      },
      orderBy: [
        { teacher: { name: 'asc' } },
        { period: 'asc' },
      ],
    });

    if (isExport) {
      const csvData = schedules.map(schedule => ({
        Teacher_Name: schedule.teacher.name,
        Email: schedule.teacher.email,
        Department: schedule.teacher.department,
        Room: schedule.room,
        Period: schedule.period,
        Subject: schedule.subject,
        Day_Of_Week: schedule.dayOfWeek,
        Is_Teaching: schedule.isTeaching,
      }));

      const csvString = stringify(csvData, { header: true });
      return new NextResponse(csvString, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="schedule-${new Date().toISOString().split('T')[0]}.csv"`,
        }
      });
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching master schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvContent = await file.text();

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true // Add this to handle inconsistent columns
    }) as TeacherRecord[];

    const imported = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const record of records) {
        // Create or update teacher
        const teacher = await tx.user.upsert({
          where: { email: record.Email },
          create: {
            name: record.Teacher_Name,
            email: record.Email,
            password: await bcrypt.hash('password123', 10),
            role: record.isPara === 'true' ? 'PARAPROFESSIONAL' : 'TEACHER',
            department: record.Department,
            schoolId: session.user.schoolId
          },
          update: {
            name: record.Teacher_Name,
            department: record.Department
          }
        });

        // Process each period
        const periods = [
          '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
          '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B'
        ];

        for (const periodKey of periods) {
          if (record[periodKey]) {
            await tx.masterSchedule.upsert({
              where: {
                teacherId_period_dayOfWeek: {
                  teacherId: teacher.id,
                  period: periodKey,
                  dayOfWeek: periodKey.endsWith('A') ? 'A' : 'B'
                }
              },
              create: {
                teacherId: teacher.id,
                schoolId: session.user.schoolId,
                period: periodKey,
                subject: record[periodKey],
                room: record.Room,
                dayOfWeek: periodKey.endsWith('A') ? 'A' : 'B',
                isTeaching: !['Prep', 'PLC', 'PD'].includes(record[periodKey])
              },
              update: {
                subject: record[periodKey],
                room: record.Room,
                isTeaching: !['Prep', 'PLC', 'PD'].includes(record[periodKey])
              }
            });

            results.push({
              teacher: record.Teacher_Name,
              period: periodKey,
              subject: record[periodKey]
            });
          }
        }
      }
      return results;
    });

    return NextResponse.json({
      success: true,
      imported: imported.length,
      details: imported
    });

  } catch (error) {
    console.error('Import error:', error);
    // Optionally log the error message if available
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An error occurred during import');
    }
    return NextResponse.json({
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}