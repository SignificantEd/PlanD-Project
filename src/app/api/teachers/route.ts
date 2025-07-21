import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { ITeacher } from '../../../types/interfaces';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all teachers and paraprofessionals with their master schedule
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          in: ['TEACHER', 'teacher', 'paraprofessional']
        }
      },
      include: {
        masterSchedule: {
          select: {
            period: true,
            subject: true,
            room: true,
            isTeaching: true,
            dayOfWeek: true
          },
          orderBy: { period: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      department: teacher.department || '',
      email: teacher.email,
      phone: '',
      schedule: teacher.masterSchedule.reduce((acc, entry) => {
        if (entry.period) {
          acc[entry.period] = `${entry.subject} - ${entry.room}`;
        }
        return acc;
      }, {} as Record<string, string>),
      assignedCoverageCount: 0,
      isInternal: true,
      isPara: teacher.role.toLowerCase() === 'paraprofessional',
      maxLoad: 6,
      maxWeeklyLoad: 30,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      role: teacher.role,
      schoolId: teacher.schoolId
    }));
    return NextResponse.json(formattedTeachers);
  } catch (error) {
    console.error('❌ Error in /api/teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}