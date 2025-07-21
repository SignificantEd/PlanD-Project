import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

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

async function main() {
  console.log('🌱 Truncating all relevant tables...');
  await prisma.coverageAssignment.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.masterSchedule.deleteMany({});
  await prisma.substitute.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});
  console.log('✅ All tables truncated.');

  const hashedPassword = await hash('password123', 10);

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

  // Seed Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@debug.edu',
      password: hashedPassword,
      role: 'admin',
      schoolId: school.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Admin created:', admin.name);
  console.log('\n🎉 Database seeding complete!');
  console.log('📊 Login credentials:');
  console.log('   Email: admin@debug.edu');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
