import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function POST(request) {
    try {
        const body = await request.json();
        const { action } = body;
        if (action === 'select-all-periods') {
            // Set all substitutes to be available for all periods every day
            const allPeriods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const fullAvailability = {};
            allDays.forEach(day => {
                fullAvailability[day] = allPeriods;
            });
            // Update all substitutes
            const result = await prisma.substitute.updateMany({
                data: {
                    availability: fullAvailability
                }
            });
            return NextResponse.json({
                success: true,
                message: `Updated ${result.count} substitutes to be available for all periods every day`,
                count: result.count
            });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    catch (error) {
        console.error('Error updating bulk availability:', error);
        return NextResponse.json({ error: 'Failed to update substitute availability' }, { status: 500 });
    }
}
