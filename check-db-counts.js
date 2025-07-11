const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const msCount = await prisma.masterSchedule.count();
    const users = await prisma.user.findMany({ take: 3 });
    const masterSchedules = await prisma.masterSchedule.findMany({ take: 3 });

    console.log('--- Database Counts & Samples ---');
    console.log(`Total users: ${userCount}`);
    console.log(`Total master schedule entries: ${msCount}`);
    console.log('\nFirst 3 users:');
    users.forEach((u, i) => console.log(`${i + 1}.`, u));
    console.log('\nFirst 3 master schedule entries:');
    masterSchedules.forEach((ms, i) => console.log(`${i + 1}.`, ms));
  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 