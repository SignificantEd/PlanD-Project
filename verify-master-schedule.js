const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMasterSchedule() {
  console.log('🔍 Verifying Master Schedule Data...\n');

  try {
    // Count teachers
    const teacherCount = await prisma.user.count({
      where: {
        role: {
          in: ['teacher', 'paraprofessional']
        }
      }
    });

    console.log(`📊 Teacher Count: ${teacherCount}`);

    // Count master schedule entries
    const scheduleCount = await prisma.masterSchedule.count();
    console.log(`📅 Master Schedule Entries: ${scheduleCount}`);

    // Count by department
    const departmentStats = await prisma.user.groupBy({
      by: ['department'],
      where: {
        role: {
          in: ['teacher', 'paraprofessional']
        }
      },
      _count: {
        id: true
      }
    });

    console.log('\n📚 Teachers by Department:');
    departmentStats.forEach(dept => {
      console.log(`   ${dept.department}: ${dept._count.id} teachers`);
    });

    // Count teaching vs free periods
    const teachingCount = await prisma.masterSchedule.count({
      where: { isTeaching: true }
    });
    const freeCount = await prisma.masterSchedule.count({
      where: { isTeaching: false }
    });

    console.log('\n⏰ Schedule Breakdown:');
    console.log(`   Teaching Periods: ${teachingCount}`);
    console.log(`   Free Periods: ${freeCount}`);
    console.log(`   Total Periods: ${teachingCount + freeCount}`);

    // Count substitutes
    const substituteCount = await prisma.substitute.count();
    console.log(`\n👨‍🏫 Substitute Teachers: ${substituteCount}`);

    // Sample a few teachers and their schedules
    console.log('\n📋 Sample Teacher Schedules:');
    const sampleTeachers = await prisma.user.findMany({
      where: {
        role: {
          in: ['teacher', 'paraprofessional']
        }
      },
      take: 3,
      include: {
        masterSchedule: {
          orderBy: { period: 'asc' }
        }
      }
    });

    sampleTeachers.forEach(teacher => {
      console.log(`\n   ${teacher.name} (${teacher.department}):`);
      teacher.masterSchedule.forEach(schedule => {
        const status = schedule.isTeaching ? '📚' : '☕';
        console.log(`     ${status} ${schedule.period}: ${schedule.subject} (${schedule.room})`);
      });
    });

    console.log('\n✅ Verification Complete!');
    console.log(`🎯 Target: 75 teachers`);
    console.log(`📈 Actual: ${teacherCount} teachers`);
    console.log(`✅ Status: ${teacherCount === 75 ? 'SUCCESS' : 'MISMATCH'}`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMasterSchedule(); 