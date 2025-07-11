import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { assignCoverageForAbsence } from '@/lib/coverage-algorithm';
const prisma = new PrismaClient();
export async function POST(request) {
    try {
        // Find all absences with status 'pending'
        const absences = await prisma.absence.findMany({
            where: { status: 'pending' },
        });
        if (!absences.length) {
            return NextResponse.json({ message: 'No pending absences found.' }, { status: 200 });
        }
        const results = [];
        for (const absence of absences) {
            // Run the proprietary algorithm for each absence
            const result = await assignCoverageForAbsence(prisma, absence);
            results.push({ absenceId: absence.id, result });
        }
        return NextResponse.json({ message: 'Coverage assignment complete.', results }, { status: 200 });
    }
    catch (error) {
        console.error('Error assigning coverage:', error);
        return NextResponse.json({ error: 'Failed to assign coverage.' }, { status: 500 });
    }
}
