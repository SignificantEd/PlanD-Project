import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, cell, subjectSpecialties, preferredTeacherId, availability } = body;
    
    if (!name || !email || !subjectSpecialties || !availability) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const substitute = await prisma.substitute.create({
      data: {
        name,
        email,
        cell,
        subjectSpecialties,
        preferredTeacherId,
        availability,
      },
    });

    return NextResponse.json(substitute, { status: 201 });
  } catch (error) {
    console.error('Error creating substitute:', error);
    return NextResponse.json(
      { error: 'Failed to create substitute' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body);
    
    const { id, name, email, cell, subjectSpecialties, preferredTeacherId, availability } = body;
    
    if (!id || !name || !email || !subjectSpecialties || !availability) {
      console.log('Missing required fields:', { id, name, email, subjectSpecialties, availability });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Updating substitute with data:', {
      id,
      name,
      email,
      cell,
      subjectSpecialties,
      preferredTeacherId,
      availability,
    });

    const substitute = await prisma.substitute.update({
      where: { id },
      data: {
        name,
        email,
        cell,
        subjectSpecialties,
        preferredTeacherId,
        availability,
      },
    });

    console.log('Update successful:', substitute);
    return NextResponse.json(substitute);
  } catch (error) {
    console.error('Error updating substitute:', error);
    return NextResponse.json(
      { error: 'Failed to update substitute' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing substitute ID' },
        { status: 400 }
      );
    }

    await prisma.substitute.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting substitute:', error);
    return NextResponse.json(
      { error: 'Failed to delete substitute' },
      { status: 500 }
    );
  }
} 