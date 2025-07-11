import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function DELETE() {
    try {
        // Delete all coverage assignments first (due to foreign key constraints)
        await prisma.coverageAssignment.deleteMany({});
        // Then delete all absences
        await prisma.absence.deleteMany({});
        return NextResponse.json({
            success: true,
            message: 'All absences and coverage assignments have been cleared.',
            deleted: {
                coverageAssignments: 'all',
                absences: 'all'
            }
        });
    }
    catch (error) {
        console.error('Error clearing absences:', error);
        return NextResponse.json({ error: 'Failed to clear absences' }, { status: 500 });
    }
}
