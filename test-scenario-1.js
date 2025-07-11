const { PrismaClient } = require('@prisma/client');

// Test script for Scenario #1: Perfect Match
// Absent Teacher Periods = Substitute Teacher Periods
// Run with: node test-scenario-1.js

async function testScenario1() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Scenario #1: Perfect Match Coverage Assignment\n');
    console.log('📋 Scenario: Absent Teacher Periods = Substitute Teacher Periods\n');
    
    // Get today's day of week
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    console.log(`📅 Testing for ${dayOfWeek} (${today.toDateString()})`);
    
    // Get a teacher with a master schedule
    const teacher = await prisma.user.findFirst({
      where: { role: 'teacher' }
    });
    
    if (!teacher) {
      console.log('❌ No teachers found in database');
      return;
    }
    
    console.log(`👨‍🏫 Using teacher: ${teacher.name}`);
    
    // Get the teacher's teaching periods for today
    const masterSchedule = await prisma.masterSchedule.findMany({
      where: { 
        teacherId: teacher.id, 
        dayOfWeek: dayOfWeek,
        isTeaching: true 
      }
    });
    
    const teachingPeriods = masterSchedule.map(ms => ms.period);
    console.log(`📚 Teacher's teaching periods: ${teachingPeriods.join(', ')}`);
    
    if (teachingPeriods.length === 0) {
      console.log('❌ No teaching periods found for this teacher on this day');
      return;
    }
    
    // Create or get a substitute with matching availability
    const testEmail = 'perfect.match@school.edu';
    let substitute = await prisma.substitute.findUnique({ where: { email: testEmail } });
    
    // Debug: Show all teaching periods before setting availability
    console.log(`🟦 teachingPeriods before setting availability:`, teachingPeriods);
    // Always set the substitute's availability for the day to all teachingPeriods
    const availability = {};
    availability[dayOfWeek] = [...teachingPeriods];

    // Find all absent teachers for today and sort by last name
    const absencesToday = await prisma.absence.findMany({
      where: { date: today }
    });
    const absentTeacherIds = new Set(absencesToday.map(a => a.teacherId));
    const allTeachers = await prisma.user.findMany({});
    const absentTeachers = allTeachers
      .filter(t => absentTeacherIds.has(t.id))
      .sort((a, b) => {
        const aLast = a.name.split(' ').slice(-1)[0].toLowerCase();
        const bLast = b.name.split(' ').slice(-1)[0].toLowerCase();
        return aLast.localeCompare(bLast);
      });
    console.log('Absent teachers for today (sorted by last name):', absentTeachers.map(t => t.name));

    // Set preferredTeacherId to the absent teacher's ID (from this test absence)
    const preferredTeacherId = teacher.id;

    if (!substitute) {
      console.log('📝 Creating substitute with matching availability...');
      substitute = await prisma.substitute.create({
        data: {
          name: 'Perfect Match Substitute',
          email: testEmail,
          subjectSpecialties: ['Mathematics', 'Science'],
          availability: availability,
          preferredTeacherId: preferredTeacherId
        }
      });
      console.log(`👤 Created substitute: ${substitute.name}`);
      console.log(`📅 Substitute availability for ${dayOfWeek}: ${teachingPeriods.join(', ')}`);
      console.log(`⭐ Preferred teacher: ${teacher.name}`);
    } else {
      // Update availability to match scenario
      substitute = await prisma.substitute.update({
        where: { id: substitute.id },
        data: { 
          availability,
          preferredTeacherId: preferredTeacherId
        }
      });
      console.log(`👤 Using existing substitute: ${substitute.name}`);
      console.log(`📅 Updated substitute availability for ${dayOfWeek}: ${teachingPeriods.join(', ')}`);
      console.log(`⭐ Preferred teacher: ${teacher.name}`);
    }
    // Debug: Show substitute availability structure
    console.log(`🔍 Substitute availability structure:`, JSON.stringify(availability, null, 2));
    
    // Clean up any existing absences and coverage assignments for this teacher and date
    await prisma.absence.findMany({
      where: {
        teacherId: teacher.id,
        date: today
      }
    }).then(async (existingAbsences) => {
      for (const abs of existingAbsences) {
        await prisma.coverageAssignment.deleteMany({ where: { absenceId: abs.id } });
        await prisma.absence.delete({ where: { id: abs.id } });
      }
    });

    // Create an absence for the teacher
    const absence = await prisma.absence.create({
      data: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        date: today,
        absenceType: 'sick',
        status: 'pending',
        periods: teachingPeriods // Exact match with substitute availability
      }
    });
    
    console.log(`📋 Created absence for ${teacher.name} with periods: ${teachingPeriods.join(', ')}`);
    
    // Test the coverage algorithm
    console.log('\n🔍 Running coverage assignment algorithm...');
    
    const { assignCoverageForAbsence } = require('./dist/src/lib/coverage-algorithm.js');
    const results = await assignCoverageForAbsence(prisma, absence);
    
    console.log('\n📊 Coverage Assignment Results:');
    console.log('==============================');
    
    let perfectMatches = 0;
    let totalPeriods = 0;
    
    results.forEach(result => {
      totalPeriods++;
      console.log(`Period: ${result.period}`);
      console.log(`Assigned: ${result.assigned || 'UNCOVERED'}`);
      console.log(`Role: ${result.assignedRole || 'N/A'}`);
      console.log(`Reason: ${result.reason}`);
      
      if (result.assigned === substitute.name) {
        perfectMatches++;
        console.log('✅ PERFECT MATCH!');
      }
      
      console.log('---');
    });
    
    // Check if scenario #1 was successful
    console.log('\n🎯 Scenario #1 Results:');
    console.log('======================');
    console.log(`Total periods needing coverage: ${totalPeriods}`);
    console.log(`Perfect matches assigned: ${perfectMatches}`);
    console.log(`Success rate: ${((perfectMatches / totalPeriods) * 100).toFixed(1)}%`);
    
    if (perfectMatches === totalPeriods) {
      console.log('🎉 SUCCESS: All periods perfectly matched and assigned to substitute!');
      console.log('✅ Scenario #1 working correctly - substitute displayed as covering teacher');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some periods were not perfectly matched');
    }
    
    // Check database assignments
    console.log('\n🗄️  Database Coverage Assignments:');
    console.log('==================================');
    
    const coverageAssignments = await prisma.coverageAssignment.findMany({
      where: { absenceId: absence.id }
    });
    
    coverageAssignments.forEach(assignment => {
      console.log(`Assignment ID: ${assignment.id}`);
      teachingPeriods.forEach(period => {
        const periodField = `period${period}`;
        const periodTypeField = `period${period}Type`;
        
        if (assignment[periodField]) {
          console.log(`  ${period}: ${assignment[periodField]} (${assignment[periodTypeField]})`);
        }
      });
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.coverageAssignment.deleteMany({
      where: { absenceId: absence.id }
    });
    await prisma.absence.delete({
      where: { id: absence.id }
    });
    
    // Only delete the substitute if we created it
    if (substitute.name === 'Perfect Match Substitute') {
      await prisma.substitute.delete({
        where: { id: substitute.id }
      });
    }
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ An error occurred during Scenario #1 testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScenario1();