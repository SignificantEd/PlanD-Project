const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');
    
    // Check absences
    const absences = await prisma.absence.findMany({
      include: {
        teacher: true,
        coverageAssignments: true
      }
    });
    
    console.log(`📋 Found ${absences.length} absences:`);
    absences.forEach(absence => {
      console.log(`  - ${absence.teacher.name} on ${new Date(absence.date).toLocaleDateString()}`);
      console.log(`    Coverage assignments: ${absence.coverageAssignments.length}`);
      absence.coverageAssignments.forEach(coverage => {
        console.log(`      Status: ${coverage.status}`);
        // Show period assignments
        for (let i = 1; i <= 8; i++) {
          const periodField = `period${i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : `${i}th`}`;
          const typeField = `period${i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : `${i}th`}Type`;
          if (coverage[periodField]) {
            console.log(`        Period ${i}: ${coverage[periodField]} (${coverage[typeField]})`);
          }
        }
      });
    });
    
    // Check substitutes
    const substitutes = await prisma.substitute.findMany();
    console.log(`\n👤 Found ${substitutes.length} substitutes:`);
    substitutes.forEach(sub => {
      console.log(`  - ${sub.name} (${sub.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 