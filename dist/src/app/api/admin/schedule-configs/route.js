import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const school = await prisma.school.findFirst();
        if (!school) {
            return NextResponse.json({ error: 'No school found' }, { status: 404 });
        }
        const configs = await prisma.scheduleConfig.findMany({
            where: { schoolId: school.id },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(configs);
    }
    catch (error) {
        console.error('Error fetching schedule configs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const body = await request.json();
        const school = await prisma.school.findFirst();
        if (!school) {
            return NextResponse.json({ error: 'No school found' }, { status: 404 });
        }
        const config = await prisma.scheduleConfig.create({
            data: {
                ...body,
                schoolId: school.id
            }
        });
        return NextResponse.json(config);
    }
    catch (error) {
        console.error('Error creating schedule config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
