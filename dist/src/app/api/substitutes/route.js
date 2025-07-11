import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const day = searchParams.get('day');
        const period = searchParams.get('period');
        const subject = searchParams.get('subject');
        const strict = searchParams.get('strict') !== 'false';
        if (!day || !period || !subject) {
            return NextResponse.json([]);
        }
        const allSubs = await prisma.substitute.findMany();
        const availableSubs = allSubs.filter((sub) => {
            const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
            const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
            return ((!strict || specialties.includes(subject)) &&
                availability[day] &&
                availability[day].includes(period));
        });
        return NextResponse.json(availableSubs);
    }
    catch (error) {
        console.error('Error fetching substitutes:', error);
        return NextResponse.json({ error: 'Failed to fetch substitutes' }, { status: 500 });
    }
}
/**
 * Body: {
 *   absenceId: string,
 *   substituteId: string,
 *   attendanceType: 'full' | 'absent' | 'half_am' | 'half_pm' | 'custom',
 *   periodsWorked?: string[]
 * }
 */
export async function POST(req) {
    const body = await req.json();
    const { absenceId, substituteId, attendanceType, periodsWorked } = body;
    // Get the absence and periods needing coverage
    const absence = await prisma.absence.findUnique({
        where: { id: absenceId },
        include: { coverageAssignments: true }
    });
    if (!absence)
        return NextResponse.json({ error: 'Absence not found' }, { status: 404 });
    // Get all periods for this absence (from coverage assignments)
    const allPeriods = absence.coverageAssignments.map((ca) => ca.period);
    // Determine periods covered by the sub
    let coveredPeriods = [];
    if (attendanceType === 'full') {
        coveredPeriods = allPeriods;
    }
    else if (attendanceType === 'absent') {
        coveredPeriods = [];
    }
    else if (attendanceType === 'half_am') {
        // Assume AM = 1st-4th, PM = 5th-8th
        coveredPeriods = allPeriods.filter((p) => ['1st', '2nd', '3rd', '4th'].includes(p));
    }
    else if (attendanceType === 'half_pm') {
        coveredPeriods = allPeriods.filter((p) => ['5th', '6th', '7th', '8th'].includes(p));
    }
    else if (attendanceType === 'custom' && Array.isArray(periodsWorked)) {
        coveredPeriods = periodsWorked;
    }
    const uncoveredPeriods = allPeriods.filter((p) => !coveredPeriods.includes(p));
    // Record attendance
    await prisma.substituteAttendance.upsert({
        where: { substituteId_absenceId: { substituteId, absenceId } },
        update: {
            status: attendanceType,
            periodsWorked: coveredPeriods,
            date: new Date()
        },
        create: {
            substituteId,
            absenceId,
            status: attendanceType,
            periodsWorked: coveredPeriods,
            date: new Date()
        },
    });
    // For uncovered periods, trigger backup coverage assignment
    // (Assume a function assignBackupCoverage exists in coverage/route.ts)
    if (uncoveredPeriods.length > 0) {
        // You may want to import and call the assignment logic here, or send a request to /api/coverage
        // For now, just return the uncovered periods
        return NextResponse.json({ status: 'partial', uncoveredPeriods });
    }
    return NextResponse.json({ status: 'ok', coveredPeriods });
}
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, email, subjectSpecialties, availability } = body;
        if (!id || !name || !email || !subjectSpecialties || !availability) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const substitute = await prisma.substitute.update({
            where: { id },
            data: {
                name,
                email,
                subjectSpecialties,
                availability,
            },
        });
        return NextResponse.json(substitute);
    }
    catch (error) {
        console.error('Error updating substitute:', error);
        return NextResponse.json({ error: 'Failed to update substitute' }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Missing substitute ID' }, { status: 400 });
        }
        await prisma.substitute.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting substitute:', error);
        return NextResponse.json({ error: 'Failed to delete substitute' }, { status: 500 });
    }
}
