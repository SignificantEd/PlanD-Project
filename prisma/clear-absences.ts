import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAbsences() {
  try {
    console.log('🗑️  Clearing all absences and coverage assignments...');
    
    // Delete all coverage assignments first (due to foreign key constraints)
    const deletedCoverage = await prisma.coverageAssignment.deleteMany({});
    console.log(`✅ Deleted ${deletedCoverage.count} coverage assignments`);
    
    // Then delete all absences
    const deletedAbsences = await prisma.absence.deleteMany({});
    console.log(`✅ Deleted ${deletedAbsences.count} absences`);
    
    console.log('\n🎉 Successfully cleared all absence data!');
    console.log('📊 Summary:');
    console.log(`   - Coverage Assignments: ${deletedCoverage.count} deleted`);
    console.log(`   - Absences: ${deletedAbsences.count} deleted`);
    console.log('\n💡 Teachers, substitutes, and master schedules remain intact.');
    console.log('🚀 Ready to test automatic assignment with fresh data!');
    
  } catch (error) {
    console.error('❌ Error clearing absences:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAbsences(); 