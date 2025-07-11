const { PrismaClient } = require('@prisma/client');

// This is a test script to demonstrate the coverage assignment algorithm
// Run with: node test-coverage-algorithm.js

async function testCoverageAlgorithm() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing PlanD Coverage Assignment Algorithm...\n');
    
    // Get a sample absence to test with
    const absences = await prisma.absence.findMany({
      where: { status: 'pending' },
      take: 1
    });
    
    if (absences.length === 0) {
      console.log('No pending absences found. Creating a test absence...');
      
      // Create a test absence
      const testTeacher = await prisma.user.findFirst({
        where: { role: 'teacher' }
      });
      
      if (!testTeacher) {
        console.log('No teachers found in database. Please add some teachers first.');
        return;
      }
      
      const testAbsence = await prisma.absence.create({
        data: {
          teacherId: testTeacher.id,
          schoolId: testTeacher.schoolId,
          date: new Date(),
          absenceType: 'sick',
          status: 'pending',
          periods: JSON.stringify(['1st', '2nd', '3rd'])
        }
      });
      
      console.log(`Created test absence for ${testTeacher.name} on ${new Date().toDateString()}`);
      
      // Test the algorithm
      const { assignCoverageForAbsence } = require('./src/lib/coverage-algorithm.ts');
      const results = await assignCoverageForAbsence(prisma, testAbsence);
      
      console.log('\nCoverage Assignment Results:');
      console.log('==========================');
      
      results.forEach(result => {
        console.log(`Period: ${result.period}`);
        console.log(`Assigned: ${result.assigned || 'UNCOVERED'}`);
        console.log(`Role: ${result.assignedRole || 'N/A'}`);
        console.log(`Reason: ${result.reason}`);
        console.log(`Candidates Evaluated: ${result.candidateEvaluated}`);
        console.log('---');
      });
      
      // Clean up test data
      await prisma.absence.delete({
        where: { id: testAbsence.id }
      });
      
    } else {
      const absence = absences[0];
      const teacher = await prisma.user.findUnique({
        where: { id: absence.teacherId }
      });
      
      console.log(`Testing with existing absence for ${teacher?.name} on ${absence.date.toDateString()}`);
      
      // Test the algorithm
      const { assignCoverageForAbsence } = require('./src/lib/coverage-algorithm.ts');
      const results = await assignCoverageForAbsence(prisma, absence);
      
      console.log('\nCoverage Assignment Results:');
      console.log('==========================');
      
      results.forEach(result => {
        console.log(`Period: ${result.period}`);
        console.log(`Assigned: ${result.assigned || 'UNCOVERED'}`);
        console.log(`Role: ${result.assignedRole || 'N/A'}`);
        console.log(`Reason: ${result.reason}`);
        console.log(`Candidates Evaluated: ${result.candidateEvaluated}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error testing coverage algorithm:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCoverageAlgorithm(); 