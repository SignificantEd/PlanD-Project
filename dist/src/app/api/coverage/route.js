import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const absenceId = searchParams.get('absenceId');
        if (!absenceId) {
            // Optionally: return all assignments, or just []
            return NextResponse.json({ assignments: [] });
        }
        const assignment = await prisma.coverageAssignment.findFirst({
            where: { absenceId: absenceId },
        });
        if (!assignment) {
            return NextResponse.json({ assignments: [] });
        }
        // Flatten horizontal record to array
        const periods = [
            { key: 'period1st', typeKey: 'period1stType', label: '1st' },
            { key: 'period2nd', typeKey: 'period2ndType', label: '2nd' },
            { key: 'period3rd', typeKey: 'period3rdType', label: '3rd' },
            { key: 'period4th', typeKey: 'period4thType', label: '4th' },
            { key: 'period5th', typeKey: 'period5thType', label: '5th' },
            { key: 'period6th', typeKey: 'period6thType', label: '6th' },
            { key: 'period7th', typeKey: 'period7thType', label: '7th' },
            { key: 'period8th', typeKey: 'period8thType', label: '8th' },
        ];
        const assignments = periods
            .filter(p => assignment[p.key])
            .map(p => ({
            period: p.label,
            type: assignment[p.typeKey] || 'Substitute',
            assigned: assignment[p.key],
            assignedId: null, // If you want to add assignedId, you can store it in a parallel field
            status: assignment.status,
        }));
        return NextResponse.json({ assignments });
    }
    catch (error) {
        console.error('Error fetching coverage assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch coverage assignments' }, { status: 500 });
    }
}
export async function POST(request) {
    try {
        const body = await request.json();
        const { absenceId, assignedTeacherId, period, subject, notes } = body;
        const coverageAssignment = await prisma.coverageAssignment.create({
            data: {
                absenceId,
                assignedTeacherId,
                period,
                subject,
                notes,
                status: 'pending',
            },
            include: {
                absence: {
                    include: {
                        teacher: true,
                    },
                },
                assignedTeacher: true,
            },
        });
        // Update the absence status to 'assigned'
        await prisma.absence.update({
            where: { id: absenceId },
            data: { status: 'assigned' },
        });
        return NextResponse.json(coverageAssignment, { status: 201 });
    }
    catch (error) {
        console.error('Error creating coverage assignment:', error);
        return NextResponse.json({ error: 'Failed to create coverage assignment' }, { status: 500 });
    }
}
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, ...updateFields } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing coverage assignment ID' }, { status: 400 });
        }
        const updated = await prisma.coverageAssignment.update({
            where: { id },
            data: updateFields,
            include: {
                absence: { include: { teacher: true } },
                assignedTeacher: true,
            },
        });
        // Optionally update absence status if confirmed
        if (updateFields.status === 'confirmed') {
            await prisma.absence.update({ where: { id: updated.absenceId }, data: { status: 'confirmed' } });
        }
        return NextResponse.json(updated);
    }
    catch (error) {
        console.error('Error updating coverage assignment:', error);
        return NextResponse.json({ error: 'Failed to update coverage assignment' }, { status: 500 });
    }
}
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Missing coverage assignment ID' }, { status: 400 });
        }
        // Get the coverage assignment to find the absence ID
        const coverage = await prisma.coverageAssignment.findUnique({
            where: { id },
            include: { absence: true }
        });
        if (!coverage) {
            return NextResponse.json({ error: 'Coverage assignment not found' }, { status: 404 });
        }
        // Delete the coverage assignment
        await prisma.coverageAssignment.delete({ where: { id } });
        // Check if this was the last coverage assignment for the absence
        const remainingAssignments = await prisma.coverageAssignment.count({
            where: { absenceId: coverage.absenceId }
        });
        // If no more assignments, update absence status back to pending
        if (remainingAssignments === 0) {
            await prisma.absence.update({
                where: { id: coverage.absenceId },
                data: { status: 'pending' }
            });
        }
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting coverage assignment:', error);
        return NextResponse.json({ error: 'Failed to delete coverage assignment' }, { status: 500 });
    }
}
