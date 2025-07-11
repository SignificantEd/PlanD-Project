const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCoverageAssignment() {
  try {
    console.log('🧪 Testing Coverage Assignment with New Schema\n');
    
    // Get real data from database
    const absences = await prisma.absence.findMany({ take: 1 });
    const teachers = await prisma.user.findMany({ where: { role: 'teacher' }, take: 1 });
    const substitutes = await prisma.substitute.findMany({ take: 1 });
    
    if (absences.length === 0) {
      console.log('❌ No absences found in database. Please create an absence first.');
      return;
    }
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database.');
      return;
    }
    
    if (substitutes.length === 0) {
      console.log('❌ No substitutes found in database.');
      return;
    }
    
    const testAbsence = absences[0];
    const testTeacher = teachers[0];
    const testSubstitute = substitutes[0];
    
    console.log(`Using absence: ${testAbsence.id}`);
    console.log(`Using teacher: ${testTeacher.name} (${testTeacher.id})`);
    console.log(`Using substitute: ${testSubstitute.name} (${testSubstitute.id})`);
    
    // Test 1: Check if we can create a coverage assignment with a teacher
    console.log('\n1. Testing teacher assignment...');
    const teacherAssignment = await prisma.coverageAssignment.create({
      data: {
        absenceId: testAbsence.id,
        assignedTeacherId: testTeacher.id,
        period: '1st',
        subject: 'Math',
        room: '101',
        notes: 'Test teacher assignment',
        status: 'pending'
      }
    });
    console.log('✅ Teacher assignment created:', teacherAssignment.id);
    
    // Test 2: Check if we can create a coverage assignment with a substitute
    console.log('\n2. Testing substitute assignment...');
    const substituteAssignment = await prisma.coverageAssignment.create({
      data: {
        absenceId: testAbsence.id,
        assignedSubstituteId: testSubstitute.id,
        period: '2nd',
        subject: 'Science',
        room: '102',
        notes: 'Test substitute assignment',
        status: 'pending'
      }
    });
    console.log('✅ Substitute assignment created:', substituteAssignment.id);
    
    // Test 3: Check if we can query assignments
    console.log('\n3. Testing query...');
    const assignments = await prisma.coverageAssignment.findMany({
      where: {
        absenceId: testAbsence.id
      }
    });
    console.log('✅ Found assignments:', assignments.length);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.period}: ${assignment.assignedTeacherId ? 'Teacher' : 'Substitute'}`);
    });
    
    // Clean up test data
    console.log('\n4. Cleaning up test data...');
    await prisma.coverageAssignment.deleteMany({
      where: {
        id: { in: [teacherAssignment.id, substituteAssignment.id] }
      }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! The schema supports both teachers and substitutes.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCoverageAssignment(); 