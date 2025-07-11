import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const schedules = await prisma.masterSchedule.findMany({
            include: {
                teacher: true,
                school: true,
            },
            orderBy: [
                { teacher: { name: 'asc' } },
                { period: 'asc' },
            ],
        });
        return NextResponse.json(schedules);
    }
    catch (error) {
        console.error('Error fetching master schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch master schedule' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const body = await request.json();
        const { teacherId, schoolId, period, subject, room, dayOfWeek, isTeaching } = body;
        const schedule = await prisma.masterSchedule.create({
            data: {
                teacherId,
                schoolId,
                period,
                subject,
                room,
                dayOfWeek,
                isTeaching,
            },
            include: {
                teacher: true,
                school: true,
            },
        });
        return NextResponse.json(schedule, { status: 201 });
    }
    catch (error) {
        console.error('Error creating schedule entry:', error);
        return NextResponse.json({ error: 'Failed to create schedule entry' }, { status: 500 });
    }
}
