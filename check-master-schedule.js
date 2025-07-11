const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMasterSchedule() {
  try {
    console.log('Checking master schedule data...');
    
    // Get all master schedule entries
    const allEntries = await prisma.masterSchedule.findMany({
      include: {
        teacher: true
      }
    });
    
    console.log(`Total master schedule entries: ${allEntries.length}`);
    
    if (allEntries.length > 0) {
      console.log('\nSample entries:');
      allEntries.slice(0, 10).forEach((entry, index) => {
        console.log(`${index + 1}. Teacher: ${entry.teacher.name}, Period: ${entry.period}, Day: ${entry.dayOfWeek}, Subject: ${entry.subject}, isTeaching: ${entry.isTeaching}`);
      });
      
      // Check for entries with dayOfWeek
      const withDayOfWeek = allEntries.filter(entry => entry.dayOfWeek !== null);
      console.log(`\nEntries with dayOfWeek: ${withDayOfWeek.length}`);
      
      // Check for entries without dayOfWeek (daily schedule)
      const withoutDayOfWeek = allEntries.filter(entry => entry.dayOfWeek === null);
      console.log(`Entries without dayOfWeek (daily): ${withoutDayOfWeek.length}`);
      
      // Get unique dayOfWeek values
      const uniqueDays = [...new Set(allEntries.map(entry => entry.dayOfWeek).filter(day => day !== null))];
      console.log(`Unique dayOfWeek values: ${JSON.stringify(uniqueDays)}`);
      
      // Get unique periods
      const uniquePeriods = [...new Set(allEntries.map(entry => entry.period))];
      console.log(`Unique periods: ${JSON.stringify(uniquePeriods)}`);
      
      // Check for a specific teacher
      const firstTeacher = allEntries[0]?.teacher;
      if (firstTeacher) {
        console.log(`\nChecking entries for teacher: ${firstTeacher.name} (ID: ${firstTeacher.id})`);
        const teacherEntries = allEntries.filter(entry => entry.teacherId === firstTeacher.id);
        console.log(`Teacher has ${teacherEntries.length} entries`);
        
        teacherEntries.slice(0, 5).forEach((entry, index) => {
          console.log(`  ${index + 1}. Period: ${entry.period}, Day: ${entry.dayOfWeek}, Subject: ${entry.subject}, isTeaching: ${entry.isTeaching}`);
        });
      }
    } else {
      console.log('No master schedule entries found!');
    }
    
  } catch (error) {
    console.error('Error checking master schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMasterSchedule(); 