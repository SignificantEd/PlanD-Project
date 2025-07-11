const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseComplete() {
  console.log('🔍 Complete Database Verification\n');

  try {
    // Check substitutes
    const substitutes = await prisma.substitute.findMany();
    console.log(`📚 Substitutes: ${substitutes.length}`);
    if (substitutes.length > 0) {
      console.log('Sample substitute data:');
      const sample = substitutes[0];
      console.log(`  Name: ${sample.name}`);
      console.log(`  Email: ${sample.email}`);
      console.log(`  Specialties: ${JSON.stringify(sample.subjectSpecialties)}`);
      console.log(`  Availability: ${JSON.stringify(sample.availability)}`);
    }

    // Check teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' }
    });
    console.log(`\n👨‍🏫 Teachers: ${teachers.length}`);

    // Check paraprofessionals
    const parapros = await prisma.user.findMany({
      where: { role: 'paraprofessional' }
    });
    console.log(`👨‍💼 Paraprofessionals: ${parapros.length}`);

    // Check master schedule
    const masterSchedule = await prisma.masterSchedule.findMany();
    console.log(`\n📅 Master Schedule Entries: ${masterSchedule.length}`);

    // Check free periods
    const freePeriods = await prisma.masterSchedule.findMany({
      where: { isTeaching: false }
    });
    console.log(`🆓 Free Periods: ${freePeriods.length}`);

    // Check absences
    const absences = await prisma.absence.findMany();
    console.log(`\n🏥 Absences: ${absences.length}`);

    // Check coverage assignments
    const coverage = await prisma.coverageAssignment.findMany();
    console.log(`📋 Coverage Assignments: ${coverage.length}`);

    // Check schools
    const schools = await prisma.school.findMany();
    console.log(`\n🏫 Schools: ${schools.length}`);

    // Sample data verification
    console.log('\n📊 Sample Data Verification:');
    
    if (substitutes.length > 0) {
      const sub = substitutes[0];
      const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
      const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
      
      console.log(`  Substitute specialties: ${specialties.join(', ')}`);
      console.log(`  Substitute availability for Monday: ${availability.Monday ? availability.Monday.join(', ') : 'None'}`);
    }

    if (teachers.length > 0) {
      const teacher = teachers[0];
      console.log(`  Teacher department: ${teacher.department}`);
      console.log(`  Teacher role: ${teacher.role}`);
    }

    if (masterSchedule.length > 0) {
      const schedule = masterSchedule[0];
      console.log(`  Schedule period: ${schedule.period}`);
      console.log(`  Schedule isTeaching: ${schedule.isTeaching}`);
      console.log(`  Schedule subject: ${schedule.subject}`);
    }

    console.log('\n✅ Database verification complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function assignCoverageForAbsence(absence) {
  const periods = absence.periods || [];
  const date = absence.date;
  const teacherId = absence.teacherId;
  const department = absence.department;
  const assignments = [];

  // Get all teachers (excluding the absent one)
  const teachers = await prisma.user.findMany({
    where: {
      role: 'teacher',
      id: { not: teacherId },
      department: department,
    },
  });

  // Get all master schedule entries for the date
  const msEntries = await prisma.masterSchedule.findMany({
    where: {
      dayOfWeek: getDayOfWeek(new Date(date)),
    },
  });

  // Track daily load for each teacher
  const loadMap = {};
  for (const t of teachers) loadMap[t.id] = 0;

  for (const period of periods) {
    // Find available teachers in the same department
    const available = teachers.filter(t => {
      // Not already over max load (let's say 6 for demo)
      if (loadMap[t.id] >= 6) return false;
      // Not teaching this period
      const teaching = msEntries.find(ms => ms.teacherId === t.id && ms.period === period && ms.isTeaching);
      return !teaching;
    });
    let assigned = null;
    let reason = '';
    if (available.length > 0) {
      assigned = available[0];
      reason = 'Same department, available, under load';
    } else {
      // Fallback: any teacher not over load and not teaching this period
      const allTeachers = await prisma.user.findMany({
        where: {
          role: 'teacher',
          id: { not: teacherId },
        },
      });
      const fallback = allTeachers.find(t => {
        if (loadMap[t.id] >= 6) return false;
        const teaching = msEntries.find(ms => ms.teacherId === t.id && ms.period === period && ms.isTeaching);
        return !teaching;
      });
      if (fallback) {
        assigned = fallback;
        reason = 'Other department, available, under load';
      }
    }
    if (assigned) {
      loadMap[assigned.id]++;
      await prisma.coverageAssignment.create({
        data: {
          absenceId: absence.id,
          [`period${period}`]: assigned.name,
          [`period${period}Type`]: 'Teacher',
        },
      });
      console.log(`Assigned ${assigned.name} to cover period ${period} (${reason})`);
      assignments.push({ period, assigned: assigned.name, reason });
    } else {
      console.log(`No available staff for period ${period}`);
      assignments.push({ period, assigned: null, reason: 'No available staff' });
    }
  }
  return assignments;
}

function getDayOfWeek(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

async function main() {
  const absence = await prisma.absence.findFirst({ where: { periods: { not: null } } });
  if (!absence) {
    console.log('No absence with periods found.');
    await prisma.$disconnect();
    return;
  }
  // Get department for absent teacher
  const teacher = await prisma.user.findUnique({ where: { id: absence.teacherId } });
  absence.department = teacher.department;
  await assignCoverageForAbsence(absence);
  await prisma.$disconnect();
}

main();

checkDatabaseComplete(); 