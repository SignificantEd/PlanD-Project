const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking current database contents...\n');

    // Check schools
    const schools = await prisma.school.findMany();
    console.log(`📚 Schools: ${schools.length}`);
    schools.forEach(school => {
      console.log(`  - ${school.name} (${school.id})`);
    });

    // Check users (teachers and paras)
    const users = await prisma.user.findMany();
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - ${user.department}`);
    });

    // Check substitutes
    const substitutes = await prisma.substitute.findMany();
    console.log(`\n🔄 Substitutes: ${substitutes.length}`);
    substitutes.forEach(sub => {
      console.log(`  - ${sub.name} (${sub.email})`);
    });

    // Check absences
    const absences = await prisma.absence.findMany({
      include: {
        teacher: true
      }
    });
    console.log(`\n🏥 Absences: ${absences.length}`);
    absences.forEach(absence => {
      console.log(`  - ${absence.teacher?.name || absence.teacherId} on ${absence.date} (${absence.status})`);
      if (absence.periods) {
        console.log(`    Periods: ${JSON.stringify(absence.periods)}`);
      }
    });

    // Check master schedule
    const masterSchedule = await prisma.masterSchedule.findMany();
    console.log(`\n📅 Master Schedule Entries: ${masterSchedule.length}`);
    masterSchedule.forEach(ms => {
      console.log(`  - ${ms.teacherId} - ${ms.period} - ${ms.dayOfWeek} - Teaching: ${ms.isTeaching}`);
    });

    // Check coverage assignments
    const assignments = await prisma.coverageAssignment.findMany();
    console.log(`\n📋 Coverage Assignments: ${assignments.length}`);
    assignments.forEach(assignment => {
      console.log(`  - Absence: ${assignment.absenceId} - Status: ${assignment.status}`);
    });

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 