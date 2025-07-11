const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const checkAbsences = async () => {
  try {
    console.log('🔍 Checking absences in database...\n');

    // Get all absences
    const absences = await prisma.absence.findMany({
      include: {
        teacher: true,
        school: true,
        coverageAssignments: true
      }
    });

    console.log(`📊 Found ${absences.length} absences:`);
    
    if (absences.length === 0) {
      console.log('❌ No absences found in database');
      return;
    }

    absences.forEach((absence, index) => {
      console.log(`\n${index + 1}. Absence ID: ${absence.id}`);
      console.log(`   Teacher: ${absence.teacher?.name || 'Unknown'}`);
      console.log(`   Date: ${new Date(absence.date).toLocaleDateString()}`);
      console.log(`   Type: ${absence.absenceType}`);
      console.log(`   Status: ${absence.status}`);
      console.log(`   Periods: ${JSON.stringify(absence.periods)}`);
      console.log(`   Coverage Assignments: ${absence.coverageAssignments.length}`);
    });

  } catch (error) {
    console.error('❌ Error checking absences:', error);
  } finally {
    await prisma.$disconnect();
  }
};

checkAbsences(); 