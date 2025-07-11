import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    let where: any = {};
    if (teacherId) {
      where.teacherId = teacherId;
    }
    
    const masterSchedules = await prisma.masterSchedule.findMany({
      where,
      include: {
        teacher: true,
        school: true,
      },
      orderBy: [
        { teacher: { name: 'asc' } },
        { period: 'asc' }
      ],
    });
    
    return NextResponse.json(masterSchedules);
  } catch (error) {
    console.error('Error fetching master schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master schedules' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, period, subject, room } = body;
    let isTeaching = true;
    let finalSubject = subject;
    let finalRoom = room;
    if (typeof subject === 'string' && subject.trim().toLowerCase().startsWith('free')) {
      isTeaching = false;
      finalSubject = 'Free Period';
      finalRoom = 'N/A';
    }
    const updated = await prisma.masterSchedule.updateMany({
      where: { teacherId, period },
      data: { subject: finalSubject, room: finalRoom, isTeaching },
    });
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error updating master schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update master schedule' },
      { status: 500 }
    );
  }
} 