import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        let where = { isTeaching: true };
        if (teacherId) {
            where.teacherId = teacherId;
        }
        // Simple filter to exclude common non-teaching periods
        const excludePeriods = ['Prep', 'Lunch', 'PLC', 'PD', 'Advisory', 'Passing', 'Assembly'];
        where.period = { notIn: excludePeriods };
        const masterSchedules = await prisma.masterSchedule.findMany({
            where,
            include: {
                teacher: true,
                school: true,
            },
            orderBy: { period: 'asc' },
        });
        return NextResponse.json(masterSchedules);
    }
    catch (error) {
        console.error('Error fetching master schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch master schedules' }, { status: 500 });
    }
}
