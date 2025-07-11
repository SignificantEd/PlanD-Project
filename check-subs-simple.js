const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTeachersWithSchedule() {
  try {
    console.log('🔍 Listing teaching periods for all teachers (only with dayOfWeek set)...\n');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          in: ['teacher', 'paraprofessional']
        }
      },
      orderBy: { name: 'asc' }
    });
    if (teachers.length === 0) {
      console.log('No teachers found.');
      return;
    }
    for (const teacher of teachers) {
      let hasAny = false;
      let output = `${teacher.name}`;
      if (teacher.department) output += `\nDepartment: ${teacher.department}`;
      let dayLines = [];
      for (const day of days) {
        const teachingPeriods = await prisma.masterSchedule.findMany({
          where: {
            teacherId: teacher.id,
            dayOfWeek: day,
            isTeaching: true
          },
          orderBy: { period: 'asc' }
        });
        const periods = teachingPeriods.map(ms => ms.period);
        if (periods.length > 0) {
          hasAny = true;
          dayLines.push(`  ${day}: ${periods.join(', ')}`);
        }
      }
      if (hasAny) {
        console.log(output);
        dayLines.forEach(line => console.log(line));
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTeachersWithSchedule(); 