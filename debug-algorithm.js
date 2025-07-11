const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAlgorithm() {
  console.log('🔍 Debugging coverage assignment algorithm...\n');

  // Test data
  const testDate = new Date('2024-01-15'); // Monday
  const testPeriod = '1st';
  const testSubject = 'History';
  const testTeacherId = 'test-teacher-id';

  console.log(`📅 Test Date: ${testDate.toDateString()}`);
  console.log(`⏰ Test Period: ${testPeriod}`);
  console.log(`📚 Test Subject: ${testSubject}\n`);

  // Get day of week
  function getDayOfWeek(date) {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
  }
  const day = getDayOfWeek(testDate);
  console.log(`📆 Day of Week: ${day}`);

  // Get all substitutes
  const allSubs = await prisma.substitute.findMany();
  console.log(`\n📚 Total Substitutes: ${allSubs.length}`);

  // Test Step 1: Substitute pool (subject match)
  console.log('\n🔍 Step 1: Substitute pool (subject match)');
  const step1Candidates = allSubs.filter(sub => {
    const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
    const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
    
    console.log(`  Checking ${sub.name}:`);
    console.log(`    Specialties: ${JSON.stringify(specialties)}`);
    console.log(`    Availability for ${day}: ${JSON.stringify(availability[day])}`);
    console.log(`    Subject match: ${specialties.includes(testSubject)}`);
    console.log(`    Available on ${day}: ${availability[day] ? 'Yes' : 'No'}`);
    console.log(`    Available for ${testPeriod}: ${availability[day] && availability[day].includes(testPeriod) ? 'Yes' : 'No'}`);
    
    return (
      specialties.includes(testSubject) &&
      availability[day] &&
      availability[day].includes(testPeriod)
    );
  });

  console.log(`\n✅ Step 1 candidates: ${step1Candidates.length}`);
  step1Candidates.forEach(sub => console.log(`  - ${sub.name}`));

  // Test Step 5: Substitute pool (subject mismatch, but available)
  console.log('\n🔍 Step 5: Substitute pool (subject mismatch, but available)');
  const step5Candidates = allSubs.filter(sub => {
    const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
    const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
    
    return (
      availability[day] &&
      availability[day].includes(testPeriod)
    );
  });

  console.log(`\n✅ Step 5 candidates: ${step5Candidates.length}`);
  step5Candidates.forEach(sub => console.log(`  - ${sub.name}`));

  // Check teachers and master schedule
  const teachers = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'teacher' },
        { role: 'paraprofessional' },
      ],
    },
  });

  const masterSchedules = await prisma.masterSchedule.findMany();
  
  console.log(`\n👨‍🏫 Total Teachers: ${teachers.length}`);
  console.log(`📅 Total Master Schedule Entries: ${masterSchedules.length}`);

  // Check free periods for the test period
  const freePeriods = masterSchedules.filter(ms => 
    ms.period === testPeriod && ms.isTeaching === false
  );
  console.log(`\n🆓 Free periods for ${testPeriod}: ${freePeriods.length}`);

  await prisma.$disconnect();
}

debugAlgorithm().catch(console.error); 