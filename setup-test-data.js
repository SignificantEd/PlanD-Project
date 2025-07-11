const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const setupTestData = async () => {
  try {
    console.log('🔧 Setting up test data for substitute attendance...\n');

    // Get a teacher and create an absence
    const teacher = await prisma.user.findFirst({
      where: { role: 'teacher' }
    });

    if (!teacher) {
      console.log('❌ No teachers found in database');
      return;
    }

    console.log(`👨‍🏫 Using teacher: ${teacher.name}`);

    // Get the school ID from the teacher
    const schoolId = teacher.schoolId;
    
    // Create an absence for today
    const today = new Date();
    const absence = await prisma.absence.create({
      data: {
        teacherId: teacher.id,
        schoolId: schoolId,
        date: today,
        absenceType: 'sick',
        periods: ['1st', '2nd', '3rd', '4th'], // Teaching periods only
        status: 'pending'
      }
    });

    console.log(`📋 Created absence: ${absence.id} for ${today.toLocaleDateString()}`);

    // Get a substitute
    const substitute = await prisma.substitute.findFirst();
    
    if (!substitute) {
      console.log('❌ No substitutes found. Creating a test substitute...');
      
      const newSubstitute = await prisma.substitute.create({
        data: {
          name: 'Test Substitute',
          email: 'test.sub@school.edu',
          subjectSpecialties: ['Mathematics', 'Science'],
          availability: {
            'Monday': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
            'Tuesday': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
            'Wednesday': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
            'Thursday': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
            'Friday': ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
          }
        }
      });
      
      console.log(`👤 Created test substitute: ${newSubstitute.name}`);
    }

    // Create a single coverage assignment record for all periods (horizontal structure)
    await prisma.coverageAssignment.create({
      data: {
        absenceId: absence.id,
        period1st: substitute ? substitute.name : 'Test Substitute',
        period1stType: 'Substitute',
        period2nd: substitute ? substitute.name : 'Test Substitute',
        period2ndType: 'Substitute',
        period3rd: substitute ? substitute.name : 'Test Substitute',
        period3rdType: 'Substitute',
        period4th: substitute ? substitute.name : 'Test Substitute',
        period4thType: 'Substitute',
        status: 'assigned'
      }
    });
    console.log(`📚 Created coverage assignment for periods 1st–4th`);

    console.log('\n✅ Test data setup complete!');
    console.log(`📊 Created 1 coverage assignment`);
    console.log(`🎯 You can now run: node test-substitute-attendance.js`);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

setupTestData(); 