import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const substitutes = await prisma.substitute.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(substitutes);
    }
    catch (error) {
        console.error('Error fetching substitutes:', error);
        return NextResponse.json({ error: 'Failed to fetch substitutes' }, { status: 500 });
    }
}
