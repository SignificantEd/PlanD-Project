import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient();

function getDefaultSettings() {
  return {
    schoolName: 'Debug School',
    schoolYearStart: '2024-09-01',
    schoolYearEnd: '2025-06-30',
    periodsPerDay: 8,
    periodNames: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
    abScheduleType: 'None',
    nonTeachingPeriodTypes: ['Prep', 'PLC', 'PD', 'Lunch'],
    maxSubstituteCoverage: 6,
    maxInternalCoverageNormal: 2,
    maxInternalCoverageEmergency: 4,
    departmentMatchingEnabled: true,
    workloadBalancingEnabled: true,
    absenceTypes: [
      { name: 'Full Day', periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'] },
      { name: 'Half Day AM', periods: ['1st', '2nd', '3rd', '4th'] },
      { name: 'Half Day PM', periods: ['5th', '6th', '7th', '8th'] },
      { name: 'Para', periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'] }
    ],
    approvalRequired: true,
    autoAssignEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function shuffle(array: string[]): string[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

async function main() {
  console.log('🌱 Truncating all relevant tables...');
  await prisma.coverageAssignment.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.masterSchedule.deleteMany({});
  await prisma.substitute.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.masterSchedule.deleteMany({});
  console.log('✅ All tables truncated.');

  // Seed School
  const school = await prisma.school.create({
    data: {
      id: 'debug-school-1',
      name: 'Debug School',
      location: '123 Debug St',
      type: 'public',
      settings: getDefaultSettings(),
    },
  });

  console.log(`✅ School created: ${school.name}`);

  // Seed 9 Teachers with unique names
  const teachers = [
    { name: 'A. Smith', email: 'asmith@debug.edu', department: 'Mathematics' },
    { name: 'B. Johnson', email: 'bjohnson@debug.edu', department: 'Science' },
    { name: 'C. Williams', email: 'cwilliams@debug.edu', department: 'English' },
    { name: 'D. Brown', email: 'dbrown@debug.edu', department: 'History' },
    { name: 'E. Davis', email: 'edavis@debug.edu', department: 'Foreign Languages' },
    { name: 'F. Miller', email: 'fmiller@debug.edu', department: 'Physical Education' },
    { name: 'G. Wilson', email: 'gwilson@debug.edu', department: 'Arts' },
    { name: 'H. Moore', email: 'hmoore@debug.edu', department: 'Music' },
    { name: 'I. Taylor', email: 'itaylor@debug.edu', department: 'Special Education' }
  ];

  const createdTeachers = [];
  for (const teacher of teachers) {
    const createdTeacher = await prisma.user.create({
      data: {
        id: generateId(),
        name: teacher.name,
        email: teacher.email,
        password: '$2a$10$samplehashedpassword',
        role: 'teacher',
        schoolId: 'debug-school-1',
        department: teacher.department,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    createdTeachers.push(createdTeacher);
    console.log(`✅ Teacher created: ${teacher.name} (${teacher.department})`);
  }

  // Seed 1 Paraprofessional
  const para = await prisma.user.create({
    data: {
      id: generateId(),
      name: 'J. Anderson',
      email: 'janderson@debug.edu',
      password: '$2a$10$samplehashedpassword',
      role: 'teacher',
      schoolId: 'debug-school-1',
      department: 'Paraprofessional',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Paraprofessional seeded: J. Anderson');

  // Seed 2 Substitutes
  await prisma.substitute.create({
    data: {
      id: generateId(),
      name: 'K. Thomas',
      email: 'kthomas@debug.edu',
      cell: '555-111-2222',
      subjectSpecialties: ['Math', 'Science', 'English', 'History', 'Foreign Languages', 'PE', 'Arts', 'Music'],
      availability: {
        Monday: ['1st','2nd','3rd','4th','5th','6th','7th','8th'],
        Tuesday: ['1st','2nd','3rd','4th','5th','6th','7th','8th'],
        Wednesday: ['1st','2nd','3rd','4th','5th','6th','7th','8th'],
        Thursday: ['1st','2nd','3rd','4th','5th','6th','7th','8th'],
        Friday: ['1st','2nd','3rd','4th','5th','6th','7th','8th']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.substitute.create({
    data: {
      id: generateId(),
      name: 'L. Jackson',
      email: 'ljackson@debug.edu',
      cell: '555-222-3333',
      subjectSpecialties: ['Math', 'Science'],
      availability: {
        Monday: ['5th','6th','7th','8th'],
        Tuesday: ['5th','6th','7th','8th'],
        Wednesday: ['5th','6th','7th','8th'],
        Thursday: ['5th','6th','7th','8th'],
        Friday: ['5th','6th','7th','8th']
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 2 Substitutes seeded: K. Thomas, L. Jackson');

  // Seed a realistic, scattered master schedule for Monday
  const periodNames = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const nonTeachingTypes = ['Prep', 'PLC', 'PD', 'Lunch'];
  let msCount = 0;

  // Teachers: 5-6 teaching, 2-3 non-teaching, scattered
  let roomCounter = 101;
  for (const teacher of createdTeachers) {
    const teachingPeriods = shuffle([...periodNames]).slice(0, Math.floor(Math.random() * 2) + 5); // 5 or 6
    const nonTeachingPeriods = periodNames.filter(p => !teachingPeriods.includes(p));
    let nonTeachingTypeIdx = 0;
    for (const period of periodNames) {
      const isTeaching = teachingPeriods.includes(period);
      await prisma.masterSchedule.create({
        data: {
          id: generateId(),
          teacherId: teacher.id,
          schoolId: 'debug-school-1',
          period,
          subject: isTeaching ? (teacher.department || '') : '',
          room: isTeaching ? `R${roomCounter++}` : '',
          dayOfWeek: 'Monday',
          isTeaching,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      msCount++;
    }
  }

  // Paraprofessional: 7 assigned, 1 free, scattered
  let paraRoomCounter = 201;
  const paraPeriods = shuffle([...periodNames]);
  const paraAssigned = paraPeriods.slice(0, 7);
  for (const period of periodNames) {
    const isAssigned = paraAssigned.includes(period);
    await prisma.masterSchedule.create({
      data: {
        id: generateId(),
        teacherId: para.id,
        schoolId: 'debug-school-1',
        period,
        subject: isAssigned ? 'Paraprofessional' : '',
        room: isAssigned ? `P${paraRoomCounter++}` : '',
        dayOfWeek: 'Monday',
        isTeaching: isAssigned,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    msCount++;
  }

  console.log(`✅ Master schedule seeded for Monday: ${msCount} entries`);

  console.log(`\n🎉 Database seeding complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - 1 School`);
  console.log(`   - 9 Teachers across 9 departments`);
  console.log(`   - 1 Paraprofessional`);
  console.log(`   - 2 Substitute teachers`);
  console.log(`   - Master schedule: ${msCount} entries (scattered)`);
  console.log(`   - All names have unique first initial + last name combinations`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 