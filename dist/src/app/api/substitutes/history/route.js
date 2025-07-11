import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const attendanceRecords = await prisma.substituteAttendance.findMany({
            include: {
                absence: {
                    include: {
                        teacher: true,
                    },
                },
                substitute: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
        return NextResponse.json(attendanceRecords);
    }
    catch (error) {
        console.error('Error fetching substitute history:', error);
        return NextResponse.json({ error: 'Failed to fetch substitute history' }, { status: 500 });
    }
}
