const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAlgorithm() {
  console.log('🧪 Testing Coverage Assignment Algorithm\n');

  // Test data - January 16, 2024 is a Tuesday
  const testDate = new Date('2024-01-16'); // Tuesday
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

  // Map teacher departments to substitute specialties
  const departmentToSpecialty = {
    'Mathematics': 'Math',
    'Science': 'Science', 
    'English': 'English',
    'History': 'History',
    'Foreign Languages': 'Foreign Languages',
    'Physical Education': 'Physical Education',
    'Arts': 'Arts',
    'Music': 'Music',
    'Paraprofessional': 'General'
  };

  // Get all data
  const allSubs = await prisma.substitute.findMany();
  const teachers = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'teacher' },
        { role: 'paraprofessional' },
      ],
    },
  });
  const masterSchedules = await prisma.masterSchedule.findMany();

  console.log(`📚 Total Substitutes: ${allSubs.length}`);
  console.log(`👨‍🏫 Total Teachers: ${teachers.length}`);
  console.log(`📅 Total Master Schedule Entries: ${masterSchedules.length}`);

  // Test Step 1: Substitute pool (subject match)
  console.log('\n🔍 Step 1: Substitute pool (subject match)');
  const step1Candidates = allSubs.filter(sub => {
    const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
    const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
    
    // Day is guaranteed to be a weekday for this test
    
    console.log(`  Checking ${sub.name}:`);
    console.log(`    Specialties: ${JSON.stringify(specialties)}`);
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

  // Test Step 2: Paraprofessionals (available)
  console.log('\n🔍 Step 2: Paraprofessionals (available)');
  const paraprofessionals = teachers.filter(t => t.role === 'paraprofessional');
  console.log(`Total paraprofessionals: ${paraprofessionals.length}`);
  
  if (paraprofessionals.length > 0) {
    const step2Candidates = paraprofessionals.filter(para => {
      const schedule = masterSchedules.filter(ms => ms.teacherId === para.id && ms.period === testPeriod);
      return schedule.length > 0 && schedule.every(ms => ms.isTeaching === false);
    });
    console.log(`Available paraprofessionals for ${testPeriod}: ${step2Candidates.length}`);
    step2Candidates.forEach(para => console.log(`  - ${para.name}`));
  }

  // Test Step 3: Internal teachers (same department)
  console.log('\n🔍 Step 3: Internal teachers (same department)');
  const regularTeachers = teachers.filter(t => t.role === 'teacher');
  const historyTeachers = regularTeachers.filter(t => t.department === 'History');
  console.log(`History teachers: ${historyTeachers.length}`);
  
  const step3Candidates = historyTeachers.filter(teacher => {
    if (teacher.id === testTeacherId) return false;
    const schedule = masterSchedules.filter(ms => ms.teacherId === teacher.id && ms.period === testPeriod);
    return schedule.length > 0 && schedule.every(ms => ms.isTeaching === false);
  });
  console.log(`Available History teachers for ${testPeriod}: ${step3Candidates.length}`);
  step3Candidates.forEach(teacher => console.log(`  - ${teacher.name}`));

  // Test Step 5: Substitute pool (subject mismatch, but available)
  console.log('\n🔍 Step 5: Substitute pool (subject mismatch, but available)');
  const step5Candidates = allSubs.filter(sub => {
    const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
    return availability[day] && availability[day].includes(testPeriod);
  });
  console.log(`Available substitutes for ${testPeriod}: ${step5Candidates.length}`);
  step5Candidates.forEach(sub => console.log(`  - ${sub.name}`));

  await prisma.$disconnect();
}

testAlgorithm().catch(console.error); 