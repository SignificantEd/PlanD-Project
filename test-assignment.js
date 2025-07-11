const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignment() {
  try {
    console.log('🧪 Testing Assignment Workflow...\n');

    // 1. Get a teacher to mark absent
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' }
    });
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found');
      return;
    }

    const testTeacher = teachers[0]; // Use the first teacher
    console.log(`📝 Marking ${testTeacher.name} absent for today...`);

    // 2. Get all teaching periods for this teacher from the master schedule
    const masterSchedule = await prisma.masterSchedule.findMany({
      where: {
        teacherId: testTeacher.id,
        isTeaching: true
      }
    });
    const periods = masterSchedule.map(ms => ms.period);
    if (periods.length === 0) {
      console.log('❌ Teacher has no teaching periods in the master schedule.');
      return;
    }
    console.log(`   Teaching periods: ${periods.join(', ')}`);

    // 3. Create a test absence for today with the correct periods
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight
    const todayStr = today.toISOString().split('T')[0];
    
    const absence = await prisma.absence.create({
      data: {
        teacherId: testTeacher.id,
        date: today,
        absenceType: 'Full Day',
        periods: periods,
        status: 'pending',
        notes: 'Test absence for assignment algorithm',
        schoolId: 'debug-school-1'
      }
    });

    console.log(`✅ Created absence: ${absence.id} for ${testTeacher.name} on ${todayStr}`);
    console.log(`   Periods: ${absence.periods.join(', ')}`);

    // 4. Trigger assignment via API
    console.log('\n🚀 Triggering assignment algorithm...');
    
    const response = await fetch('http://localhost:3001/api/coverage/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Assignment completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   Assignments created: ${result.assignments.length}`);
      console.log(`   Coverage results: ${result.coverageResults.length}`);
      console.log(`   Candidates evaluated: ${result.totalCandidatesEvaluated}`);
      console.log(`   Processing time: ${result.processingTime}ms`);
      
      if (result.assignments.length > 0) {
        console.log('\n📋 Assignments:');
        result.assignments.forEach(assignment => {
          console.log(`   - ${assignment.absentTeacherName} (${assignment.period}) → ${assignment.assignedToName} (${assignment.assignmentType})`);
        });
      }
    } else {
      console.log('❌ Assignment failed:', result.error);
    }

    // 5. Check final database state
    console.log('\n🔍 Final database state:');
    
    const finalAbsences = await prisma.absence.findMany({
      where: { date: today },
      include: { teacher: true }
    });
    console.log(`   Absences for today: ${finalAbsences.length}`);
    
    const finalAssignments = await prisma.coverageAssignment.findMany({
      where: { absenceId: absence.id }
    });
    console.log(`   Coverage assignments: ${finalAssignments.length}`);

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignment(); 