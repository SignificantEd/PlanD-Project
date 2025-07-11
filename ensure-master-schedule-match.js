const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ensureMasterScheduleMatch = async () => {
  try {
    console.log('🔧 Ensuring Master Schedule matches Absence Entry Teachers...\n');

    // Get all teachers and paraprofessionals who can report absences
    const allStaff = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'teacher' },
          { role: 'paraprofessional' },
        ],
      },
      include: {
        school: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`📋 Found ${allStaff.length} staff members who can report absences:`);
    allStaff.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.role}) - ${staff.department || 'No Department'}`);
    });

    // Get all staff who have master schedule entries
    const staffWithSchedules = await prisma.masterSchedule.findMany({
      select: {
        teacherId: true,
      },
      distinct: ['teacherId'],
    });

    const staffWithScheduleIds = new Set(staffWithSchedules.map(s => s.teacherId));
    
    console.log(`\n📅 Found ${staffWithScheduleIds.size} staff members with master schedule entries`);

    // Find staff without master schedule entries
    const staffWithoutSchedules = allStaff.filter(staff => !staffWithScheduleIds.has(staff.id));
    
    if (staffWithoutSchedules.length === 0) {
      console.log('\n✅ All staff members have master schedule entries!');
      return;
    }

    console.log(`\n⚠️  Found ${staffWithoutSchedules.length} staff members WITHOUT master schedule entries:`);
    staffWithoutSchedules.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.role}) - ${staff.department || 'No Department'}`);
    });

    // Ask if user wants to create basic master schedule entries
    console.log('\n💡 To fix this mismatch, you can:');
    console.log('1. Add master schedule entries for these staff members');
    console.log('2. Remove these staff members from the User table');
    console.log('3. Or manually add them to the master schedule through the UI');

    // Option to create basic schedule entries
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nWould you like to create basic master schedule entries for missing staff? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n📝 Creating basic master schedule entries...');
        
        const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        for (const staff of staffWithoutSchedules) {
          console.log(`  Creating schedule for ${staff.name}...`);
          
          for (const day of days) {
            const scheduleEntries = periods.map((period, index) => ({
              teacherId: staff.id,
              schoolId: staff.schoolId,
              period: period,
              subject: staff.role === 'paraprofessional' ? 'Support' : 'Subject',
              room: staff.role === 'paraprofessional' ? 'Para Room' : 'Classroom',
              dayOfWeek: day,
              isTeaching: index < 5, // First 5 periods are teaching, last 3 are free/prep/lunch
            }));
            
            await prisma.masterSchedule.createMany({
              data: scheduleEntries
            });
          }
          console.log(`    ✅ Created schedule for ${staff.name}`);
        }
        
        console.log('\n🎉 All missing staff now have basic master schedule entries!');
      } else {
        console.log('\nℹ️  No changes made. Please manually add master schedule entries for missing staff.');
      }
      
      rl.close();
    });

  } catch (error) {
    console.error('❌ Error checking master schedule match:', error);
  } finally {
    await prisma.$disconnect();
  }
};

ensureMasterScheduleMatch(); 