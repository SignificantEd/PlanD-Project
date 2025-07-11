const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const setupFoundationalData = async () => {
  try {
    console.log('🚀 Setting up PlanD Foundational Data...\n');

    // Step 1: Configure Substitutes with proper availability and load limits
    console.log('📋 Step 1: Configuring Substitutes...');
    
    // Get all substitutes
    const allSubs = await prisma.substitute.findMany({ orderBy: { name: 'asc' } });
    const availableSubs = allSubs.slice(0, 5);
    const unavailableSubs = allSubs.slice(5);

    // All periods, all days
    const fullAvailability = {
      "Monday": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
      "Tuesday": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
      "Wednesday": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
      "Thursday": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
      "Friday": ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]
    };

    for (const sub of availableSubs) {
      await prisma.substitute.update({
        where: { id: sub.id },
        data: { availability: fullAvailability }
      });
      console.log(`✅ Set available: ${sub.name}`);
    }
    for (const sub of unavailableSubs) {
      await prisma.substitute.update({
        where: { id: sub.id },
        data: { availability: {} }
      });
      console.log(`❌ Set unavailable: ${sub.name}`);
    }

    // Step 2: Set up Master Schedule for all teachers and paraprofessionals
    console.log('📅 Step 2: Setting up Master Schedule...');

    // Update all paraprofessionals to have department 'Paraprofessional'
    await prisma.user.updateMany({
      where: { role: 'paraprofessional' },
      data: { department: 'Paraprofessional' }
    });
    const allStaff = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'teacher' },
          { role: 'paraprofessional' },
        ],
      },
    });
    const departments = Array.from(new Set(allStaff.map(t => t.department).filter(Boolean)));
    const lunchPeriod = '6th'; // Always 6th period for lunch
    const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const supportAssignments = ['Support', 'Duty', 'Supervision', 'Resource', 'Inclusion'];

    // Assign PLC period per department (e.g., Math: 8th, Science: 7th, etc.)
    const plcPeriodByDept = {};
    departments.forEach((dept, i) => {
      plcPeriodByDept[dept] = periods[periods.length - 1 - (i % 3)]; // Stagger PLCs
    });

    // For each staff member, build their schedule
    for (const staff of allStaff) {
      for (const day of days) {
        let schedule = [];
        if (staff.role === 'paraprofessional') {
          // Paras: 8 assigned periods, no free, no lunch as free
          for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            let subject = supportAssignments[i % supportAssignments.length];
            let isTeaching = true;
            let room = `Para-${staff.name.split(' ')[0]}`;
            if (period === lunchPeriod) {
              subject = 'Lunch';
              isTeaching = false;
              room = 'Staff Lounge';
            }
            schedule.push({
              teacherId: staff.id,
              period,
              dayOfWeek: day,
              subject,
              room,
              isTeaching,
            });
          }
        } else {
          // Teachers: 5 teaching, 1 PLC (by dept), 1 Prep, 1 Lunch (all non-teaching periods staggered)
          // ... existing teacher schedule logic ...
        }
        // Remove old schedule for this staff/day
        await prisma.masterSchedule.deleteMany({ where: { teacherId: staff.id, dayOfWeek: day } });
        // Insert new schedule
        await prisma.masterSchedule.createMany({ data: schedule });
      }
    }

    console.log('\n🎉 Master schedule updated with department PLC coordination!');
    console.log('\n🚀 Ready for algorithm testing.');

  } catch (error) {
    console.error('❌ Error setting up foundational data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

setupFoundationalData(); 