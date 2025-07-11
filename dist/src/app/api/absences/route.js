import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET() {
    try {
        const absences = await prisma.absence.findMany({
            include: {
                teacher: true,
                school: true
                // coverageAssignments removed to avoid errors
            },
            orderBy: {
                date: 'desc',
            },
        });
        return NextResponse.json(absences);
    }
    catch (error) {
        console.error('Error fetching absences:', error);
        return NextResponse.json({ error: 'Failed to fetch absences' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const body = await request.json();
        const { teacherId, schoolId, date, absenceType, notes, periods } = body;
        // Validate required fields
        if (!teacherId || !schoolId || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Prevent duplicate absences for the same teacher and date
        const existing = await prisma.absence.findFirst({
            where: {
                teacherId,
                date: new Date(date + "T00:00:00"),
            },
        });
        if (existing) {
            return NextResponse.json({ error: 'This teacher already has an absence reported for this date.' }, { status: 400 });
        }
        // Create the absence record with periods
        const absence = await prisma.absence.create({
            data: {
                teacherId,
                schoolId,
                date: new Date(date + "T00:00:00"),
                absenceType,
                notes: notes || '',
                periods: periods || [],
            },
            include: {
                teacher: true,
                school: true,
            },
        });
        // Do NOT create any coverage assignments here
        return NextResponse.json({
            message: 'Absence created successfully',
            absence
        }, { status: 201 });
    }
    catch (error) {
        console.error('Error creating absence:', error);
        return NextResponse.json({ error: 'Failed to create absence' }, { status: 500 });
    }
}
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, ...updateFields } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing absence ID' }, { status: 400 });
        }
        const updated = await prisma.absence.update({
            where: { id },
            data: updateFields,
        });
        return NextResponse.json(updated);
    }
    catch (error) {
        console.error('Error updating absence:', error);
        return NextResponse.json({ error: 'Failed to update absence' }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Missing absence ID' }, { status: 400 });
        }
        await prisma.absence.delete({ where: { id } });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting absence:', error);
        return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
    }
}
