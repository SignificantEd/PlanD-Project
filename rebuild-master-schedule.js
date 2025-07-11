const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rebuildMasterSchedule = async () => {
  try {
    console.log('🏗️ Rebuilding Master Schedule Foundation...\n');

    // Step 1: Clear existing data
    console.log('🗑️ Step 1: Clearing existing data...');
    await prisma.coverageAssignment.deleteMany();
    await prisma.masterSchedule.deleteMany();
    await prisma.absence.deleteMany();
    await prisma.substitute.deleteMany();
    await prisma.user.deleteMany();
    await prisma.school.deleteMany();
    console.log('✅ Cleared all existing data');

    // Step 2: Create School
    console.log('\n🏫 Step 2: Creating school...');
    const school = await prisma.school.create({
      data: {
        name: "PlanD Test School",
        location: "Test City, ST",
        type: "public",
        settings: {
          periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      }
    });
    console.log(`✅ Created school: ${school.name}`);

    // Step 3: Create Teachers and Paraprofessionals
    console.log('\n👥 Step 3: Creating teachers and paraprofessionals...');
    
    const teachers = [
      // Mathematics Department
      { name: "Dr. Sarah Johnson", email: "sarah.johnson@school.edu", department: "Mathematics", role: "teacher" },
      { name: "Prof. Michael Chen", email: "michael.chen@school.edu", department: "Mathematics", role: "teacher" },
      { name: "Ms. Emily Rodriguez", email: "emily.rodriguez@school.edu", department: "Mathematics", role: "teacher" },
      
      // Science Department
      { name: "Dr. Robert Wilson", email: "robert.wilson@school.edu", department: "Science", role: "teacher" },
      { name: "Prof. Lisa Thompson", email: "lisa.thompson@school.edu", department: "Science", role: "teacher" },
      { name: "Mr. David Kim", email: "david.kim@school.edu", department: "Science", role: "teacher" },
      
      // English Department
      { name: "Prof. Katherine Moore", email: "katherine.moore@school.edu", department: "English", role: "teacher" },
      { name: "Ms. Ashley Adams", email: "ashley.adams@school.edu", department: "English", role: "teacher" },
      { name: "Mr. James Brown", email: "james.brown@school.edu", department: "English", role: "teacher" },
      
      // History Department
      { name: "Dr. Patricia Garcia", email: "patricia.garcia@school.edu", department: "History", role: "teacher" },
      { name: "Prof. Thomas Lee", email: "thomas.lee@school.edu", department: "History", role: "teacher" },
      { name: "Ms. Jennifer White", email: "jennifer.white@school.edu", department: "History", role: "teacher" },
      
      // Foreign Languages Department
      { name: "Prof. Maria Martinez", email: "maria.martinez@school.edu", department: "Foreign Languages", role: "teacher" },
      { name: "Mr. Carlos Rodriguez", email: "carlos.rodriguez@school.edu", department: "Foreign Languages", role: "teacher" },
      
      // Physical Education Department
      { name: "Coach Mark Davis", email: "mark.davis@school.edu", department: "Physical Education", role: "teacher" },
      { name: "Coach Jessica Taylor", email: "jessica.taylor@school.edu", department: "Physical Education", role: "teacher" },
      
      // Arts Department
      { name: "Ms. Rachel Green", email: "rachel.green@school.edu", department: "Arts", role: "teacher" },
      { name: "Mr. Kevin Anderson", email: "kevin.anderson@school.edu", department: "Arts", role: "teacher" },
      
      // Music Department
      { name: "Prof. Amanda Clark", email: "amanda.clark@school.edu", department: "Music", role: "teacher" },
      { name: "Mr. Steven Wright", email: "steven.wright@school.edu", department: "Music", role: "teacher" },
      
      // Paraprofessionals
      { name: "Ms. Linda Foster", email: "linda.foster@school.edu", department: "Special Education", role: "paraprofessional" },
      { name: "Mr. George Harris", email: "george.harris@school.edu", department: "Special Education", role: "paraprofessional" },
      { name: "Ms. Nancy Lewis", email: "nancy.lewis@school.edu", department: "Special Education", role: "paraprofessional" },
      { name: "Mr. Paul Walker", email: "paul.walker@school.edu", department: "Special Education", role: "paraprofessional" },
      { name: "Ms. Sandra Hall", email: "sandra.hall@school.edu", department: "Special Education", role: "paraprofessional" }
    ];

    const createdTeachers = [];
    for (const teacher of teachers) {
      const created = await prisma.user.create({
        data: {
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          role: teacher.role,
          password: "password123", // Default password
          schoolId: school.id
        }
      });
      createdTeachers.push(created);
      console.log(`✅ Created ${teacher.role}: ${teacher.name} (${teacher.department})`);
    }

    // Step 4: Create Substitutes
    console.log('\n👤 Step 4: Creating substitutes...');
    
    const substitutes = [
      { name: "Alex Carter", email: "alex.carter@substitute.edu", subjectSpecialties: ["History", "Arts"] },
      { name: "Morgan Lee", email: "morgan.lee@substitute.edu", subjectSpecialties: ["Physical Education", "History"] },
      { name: "Taylor Brooks", email: "taylor.brooks@substitute.edu", subjectSpecialties: ["Math", "Foreign Languages", "Science"] },
      { name: "Jordan Smith", email: "jordan.smith@substitute.edu", subjectSpecialties: ["Physical Education", "English"] },
      { name: "Casey Kim", email: "casey.kim@substitute.edu", subjectSpecialties: ["Science", "Physical Education", "Math"] },
      { name: "Riley Morgan", email: "riley.morgan@substitute.edu", subjectSpecialties: ["Physical Education", "History"] },
      { name: "Jamie Patel", email: "jamie.patel@substitute.edu", subjectSpecialties: ["Foreign Languages", "Science"] },
      { name: "Avery Nguyen", email: "avery.nguyen@substitute.edu", subjectSpecialties: ["History"] },
      { name: "Peyton Rivera", email: "peyton.rivera@substitute.edu", subjectSpecialties: ["Science", "Math"] },
      { name: "Drew Parker", email: "drew.parker@substitute.edu", subjectSpecialties: ["Physical Education", "Math"] },
      { name: "Skyler Evans", email: "skyler.evans@substitute.edu", subjectSpecialties: ["Physical Education", "Foreign Languages"] },
      { name: "Reese Cooper", email: "reese.cooper@substitute.edu", subjectSpecialties: ["Science", "Science"] },
      { name: "Quinn Bailey", email: "quinn.bailey@substitute.edu", subjectSpecialties: ["Physical Education", "Arts"] },
      { name: "Harper Reed", email: "harper.reed@substitute.edu", subjectSpecialties: ["Physical Education", "Physical Education", "Music"] },
      { name: "Rowan Bell", email: "rowan.bell@substitute.edu", subjectSpecialties: ["Science", "Physical Education"] },
      { name: "Finley Hayes", email: "finley.hayes@substitute.edu", subjectSpecialties: ["Science", "Arts", "Science"] },
      { name: "Dakota James", email: "dakota.james@substitute.edu", subjectSpecialties: ["Arts", "Science", "Foreign Languages"] },
      { name: "Emerson Clark", email: "emerson.clark@substitute.edu", subjectSpecialties: ["Music", "Arts"] }
    ];

    const createdSubstitutes = [];
    for (const substitute of substitutes) {
      const created = await prisma.substitute.create({
        data: {
          ...substitute,
          availability: {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
          }
        }
      });
      createdSubstitutes.push(created);
      console.log(`✅ Created substitute: ${substitute.name}`);
    }

    // Step 5: Create Master Schedule
    console.log('\n📅 Step 5: Creating master schedule...');
    
    const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const lunchPeriod = '6th'; // Always 6th period for lunch
    
    // Department PLC periods (all teachers in same department have PLC together)
    const plcPeriods = {
      "Mathematics": "8th",
      "Science": "7th", 
      "English": "5th",
      "History": "4th",
      "Foreign Languages": "3rd",
      "Physical Education": "2nd",
      "Arts": "1st",
      "Music": "8th"
    };

    // Subject assignments by department
    const subjectsByDepartment = {
      "Mathematics": ["Algebra I", "Algebra II", "Geometry", "Calculus", "Statistics"],
      "Science": ["Biology", "Chemistry", "Physics", "Environmental Science"],
      "English": ["English 9", "English 10", "English 11", "English 12", "Literature"],
      "History": ["US History", "World History", "Government", "Geography"],
      "Foreign Languages": ["Spanish I", "Spanish II", "French I", "French II"],
      "Physical Education": ["Physical Education", "Health", "Athletics"],
      "Arts": ["Art I", "Art II", "Art III", "Photography"],
      "Music": ["Band", "Choir", "Orchestra", "Music Theory"]
    };

    const rooms = ["101", "102", "103", "104", "105", "106", "107", "108", "201", "202", "203", "204", "205", "206", "207", "208", "301", "302", "303", "304", "305", "306", "307", "308"];

    // Create master schedule for each teacher
    for (const teacher of createdTeachers) {
      if (teacher.role === 'teacher') {
        for (const day of days) {
          const schedule = [];
          const department = teacher.department;
          const plcPeriod = plcPeriods[department];
          const departmentSubjects = subjectsByDepartment[department] || ["General Studies"];
          
          // Get other teachers in same department for staggered prep/lunch
          const deptTeachers = createdTeachers.filter(t => t.department === department && t.role === 'teacher');
          const teacherIndex = deptTeachers.findIndex(t => t.id === teacher.id);
          
          // Stagger prep and lunch within department
          const prepSlot = (deptTeachers.indexOf(teacher) + 2) % 8;
          const lunchSlot = 5; // Always 6th period (index 5)
          
          let teachIdx = 0;
          
          for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            let isTeaching = false;
            let subject = "";
            let room = "";
            
            if (i === lunchSlot) {
              // Lunch period
              isTeaching = false;
              subject = "Lunch";
              room = "Staff Lounge";
            } else if (period === plcPeriod) {
              // PLC period (department meeting)
              isTeaching = false;
              subject = "PD/PLC";
              room = "Department Office";
            } else if (i === prepSlot) {
              // Prep period
              isTeaching = false;
              subject = "Prep";
              room = "Teacher Office";
            } else {
              // Teaching period
              isTeaching = true;
              subject = departmentSubjects[teachIdx % departmentSubjects.length];
              room = rooms[Math.floor(Math.random() * rooms.length)];
              teachIdx++;
            }
            
            schedule.push({
              teacherId: teacher.id,
              schoolId: school.id,
              period,
              subject,
              room,
              dayOfWeek: day,
              isTeaching
            });
          }
          
          await prisma.masterSchedule.createMany({ data: schedule });
        }
        console.log(`✅ Created schedule for ${teacher.name} (${teacher.department})`);
      } else if (teacher.role === 'paraprofessional') {
        // Paraprofessionals: 8 assigned periods, no free periods
        for (const day of days) {
          const schedule = [];
          const supportAssignments = ['Support', 'Duty', 'Supervision', 'Resource', 'Inclusion'];
          
          for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            let subject = supportAssignments[i % supportAssignments.length];
            let isTeaching = true;
            let room = `Para-${teacher.name.split(' ')[0]}`;
            
            if (period === lunchPeriod) {
              subject = 'Lunch';
              isTeaching = false;
              room = 'Staff Lounge';
            }
            
            schedule.push({
              teacherId: teacher.id,
              schoolId: school.id,
              period,
              subject,
              room,
              dayOfWeek: day,
              isTeaching
            });
          }
          
          await prisma.masterSchedule.createMany({ data: schedule });
        }
        console.log(`✅ Created schedule for ${teacher.name} (${teacher.role})`);
      }
    }

    console.log('\n🎉 Master Schedule Foundation Rebuilt Successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - School: ${school.name}`);
    console.log(`   - Teachers: ${createdTeachers.filter(t => t.role === 'teacher').length}`);
    console.log(`   - Paraprofessionals: ${createdTeachers.filter(t => t.role === 'paraprofessional').length}`);
    console.log(`   - Substitutes: ${createdSubstitutes.length}`);
    console.log(`   - Master Schedule Entries: ${await prisma.masterSchedule.count()}`);
    console.log(`   - Departments: ${Object.keys(plcPeriods).length}`);

  } catch (error) {
    console.error('❌ Error rebuilding master schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
};

rebuildMasterSchedule(); 