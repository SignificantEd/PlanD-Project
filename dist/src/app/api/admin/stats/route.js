import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        // Get counts for all major entities
        const [teachers, substitutes, paraprofessionals, masterScheduleEntries, freePeriods, absences, coverageAssignments] = await Promise.all([
            prisma.user.count({ where: { role: 'teacher' } }),
            prisma.substitute.count(),
            prisma.user.count({ where: { role: 'paraprofessional' } }),
            prisma.masterSchedule.count(),
            prisma.masterSchedule.count({ where: { isTeaching: false } }),
            prisma.absence.count(),
            prisma.coverageAssignment.count()
        ]);
        return NextResponse.json({
            teachers,
            substitutes,
            paraprofessionals,
            masterScheduleEntries,
            freePeriods,
            absences,
            coverageAssignments
        });
    }
    catch (error) {
        console.error('Error fetching database stats:', error);
        return NextResponse.json({ error: 'Failed to fetch database stats' }, { status: 500 });
    }
}
