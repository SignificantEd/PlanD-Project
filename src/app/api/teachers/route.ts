import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ITeacher } from '../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all teachers and paraprofessionals with their master schedule
    const teachers = await prisma.user.findMany({
      where: {
        role: { 
          in: ['teacher', 'paraprofessional'] 
        } 
      },
      include: {
        masterSchedule: {
          orderBy: { period: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Convert to ITeacher format
    const formattedTeachers: ITeacher[] = teachers.map(teacher => {
      // Build schedule object from master schedule entries
      const schedule: { [key: string]: string } = {};
      teacher.masterSchedule.forEach(entry => {
        if (entry.period) {
          schedule[entry.period] = entry.subject;
        }
      });

      return {
        id: teacher.id,
        name: teacher.name,
        department: teacher.department || '',
        email: teacher.email,
        phone: '', // Would need to be added to schema
        schedule,
        assignedCoverageCount: 0, // Would be calculated from coverage assignments
        isInternal: true,
        isPara: teacher.role === 'paraprofessional',
        maxLoad: 6,
        maxWeeklyLoad: 30,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
        role: teacher.role,
        schoolId: teacher.schoolId
      };
    });

    return NextResponse.json(formattedTeachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
} 