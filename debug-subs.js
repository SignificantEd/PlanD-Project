const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSubstitutes() {
  console.log('🔍 Debugging substitute availability...\n');

  const testDate = new Date('2024-01-15'); // Monday
  const testPeriod = '1st';
  
  function getDayOfWeek(date) {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
  }
  const day = getDayOfWeek(testDate);
  
  console.log(`📅 Test Date: ${testDate.toDateString()}`);
  console.log(`📆 Day of Week: ${day}`);
  console.log(`⏰ Test Period: ${testPeriod}\n`);

  const allSubs = await prisma.substitute.findMany();
  
  console.log(`📚 Total Substitutes: ${allSubs.length}\n`);

  allSubs.forEach((sub, index) => {
    console.log(`${index + 1}. ${sub.name}`);
    
    const specialties = Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties);
    const availability = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
    
    console.log(`   Specialties: ${JSON.stringify(specialties)}`);
    console.log(`   Availability: ${JSON.stringify(availability)}`);
    console.log(`   Available on ${day}: ${availability[day] ? 'Yes' : 'No'}`);
    if (availability[day]) {
      console.log(`   Periods available on ${day}: ${JSON.stringify(availability[day])}`);
      console.log(`   Available for ${testPeriod}: ${availability[day].includes(testPeriod) ? 'Yes' : 'No'}`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

debugSubstitutes().catch(console.error); 