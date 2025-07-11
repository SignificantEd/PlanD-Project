import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ICSVTeacherRow } from '../../../../types/interfaces';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the CSV file
    const text = await file.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate required columns
    const requiredColumns = ['Teacher_Name', 'Department', 'Room', 'Email', 'Phone', 'isPara'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Process data rows
    const teachers = [];
    let imported = 0;
    let errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        if (values.length < headers.length) {
          errors.push(`Row ${i + 1}: Insufficient data`);
          continue;
        }

        const teacherData: any = {};
        headers.forEach((header, index) => {
          teacherData[header] = values[index]?.trim() || '';
        });

        // Validate required fields
        if (!teacherData.Teacher_Name || !teacherData.Department || !teacherData.Email) {
          errors.push(`Row ${i + 1}: Missing required fields (name, department, or email)`);
          continue;
        }

        // Parse schedule data
        const schedule: { [key: string]: string } = {};
        const periodColumns = headers.filter(h => /^\d+[AB]$/.test(h)); // e.g., 1A, 2B, etc.
        
        periodColumns.forEach(period => {
          if (teacherData[period]) {
            schedule[period] = teacherData[period];
          }
        });

        // Parse non-teaching periods
        const prepPeriods = teacherData.Prep_Periods ? teacherData.Prep_Periods.split(',').map((p: string) => p.trim()) : [];
        const plcPeriods = teacherData.PLC_Periods ? teacherData.PLC_Periods.split(',').map((p: string) => p.trim()) : [];
        const pdPeriods = teacherData.PD_Periods ? teacherData.PD_Periods.split(',').map((p: string) => p.trim()) : [];

        // Add non-teaching periods to schedule
        prepPeriods.forEach((period: string) => {
          schedule[`${period}A`] = 'Prep';
          schedule[`${period}B`] = 'Prep';
        });

        plcPeriods.forEach((period: string) => {
          schedule[`${period}A`] = 'PLC';
          schedule[`${period}B`] = 'PLC';
        });

        pdPeriods.forEach((period: string) => {
          schedule[`${period}A`] = 'PD';
          schedule[`${period}B`] = 'PD';
        });

        // Create or update teacher in database
        const teacher = await prisma.user.upsert({
          where: { email: teacherData.Email },
          update: {
            name: teacherData.Teacher_Name,
            department: teacherData.Department,
            role: 'teacher'
          },
          create: {
            email: teacherData.Email,
            name: teacherData.Teacher_Name,
            department: teacherData.Department,
            role: 'teacher',
            password: 'temp-password', // Would be set properly in production
            schoolId: 'default-school-id' // Would be set properly in production
          }
        });

        // Create master schedule entries
        for (const [period, subject] of Object.entries(schedule)) {
          await prisma.masterSchedule.upsert({
            where: {
              teacherId_period_dayOfWeek: {
                teacherId: teacher.id,
                period: period,
                dayOfWeek: 'Daily' // Daily schedule
              }
            },
            update: {
              subject: subject,
              room: teacherData.Room || 'TBD',
              isTeaching: !['Prep', 'PLC', 'PD', 'Lunch'].includes(subject)
            },
            create: {
              teacherId: teacher.id,
              period: period,
              subject: subject,
              room: teacherData.Room || 'TBD',
              dayOfWeek: 'Daily', // Daily schedule
              isTeaching: !['Prep', 'PLC', 'PD', 'Lunch'].includes(subject),
              schoolId: 'default-school-id' // Would be set properly in production
            }
          });
        }

        imported++;
        teachers.push({
          id: teacher.id,
          name: teacher.name,
          department: teacher.department,
          email: teacher.email,
          schedule
        });

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: Processing error`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${imported} teachers${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });

  } catch (error) {
    console.error('Error importing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to import schedule' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV lines that may contain commas within quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
} 