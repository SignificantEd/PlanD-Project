import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const teachers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'teacher' },
                    { role: 'paraprofessional' },
                ],
            },
            include: {
                school: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(teachers);
    }
    catch (error) {
        console.error('Error fetching teachers:', error);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }
}
