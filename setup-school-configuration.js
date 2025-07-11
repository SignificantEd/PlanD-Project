const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const setupSchoolConfiguration = async () => {
  try {
    console.log('⚙️ Setting up School Configuration System...\n');

    // Get the school
    const school = await prisma.school.findFirst();
    if (!school) {
      console.log('❌ No school found. Please run rebuild-master-schedule.js first.');
      return;
    }

    console.log(`🏫 Configuring school: ${school.name}\n`);

    // Step 1: Create Schedule Configurations
    console.log('📅 Step 1: Creating Schedule Configurations...');
    
    const scheduleConfigs = [
      {
        name: "Traditional Schedule",
        type: "traditional",
        description: "Standard 8-period daily schedule",
        config: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          periodsPerDay: 8,
          scheduleType: "daily"
        }
      },
      {
        name: "A/B Day Schedule",
        type: "ab_days",
        description: "Alternating day schedule with different periods",
        config: {
          aDays: ["Monday", "Wednesday", "Friday"],
          bDays: ["Tuesday", "Thursday"],
          aDayPeriods: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
          bDayPeriods: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
          scheduleType: "alternating"
        }
      },
      {
        name: "Block Schedule",
        type: "block",
        description: "4-block daily schedule with longer periods",
        config: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          blocks: ["A", "B", "C", "D"],
          rotation: "daily",
          scheduleType: "block"
        }
      },
      {
        name: "6-Day Cycle",
        type: "cycle",
        description: "6-day rotating schedule cycle",
        config: {
          cycleDays: ["Day1", "Day2", "Day3", "Day4", "Day5", "Day6"],
          startDate: "2024-09-01",
          scheduleType: "cycle"
        }
      }
    ];

    for (const config of scheduleConfigs) {
      await prisma.scheduleConfig.create({
        data: {
          ...config,
          schoolId: school.id,
          isActive: config.type === "traditional" // Set traditional as active by default
        }
      });
      console.log(`✅ Created schedule config: ${config.name}`);
    }

    // Step 2: Create Period Configurations
    console.log('\n⏰ Step 2: Creating Period Configurations...');
    
    const periodConfigs = [
      // Traditional periods
      { name: "1st Period", label: "1st", startTime: "08:00", endTime: "08:45", duration: 45, type: "academic", order: 1 },
      { name: "2nd Period", label: "2nd", startTime: "08:50", endTime: "09:35", duration: 45, type: "academic", order: 2 },
      { name: "3rd Period", label: "3rd", startTime: "09:40", endTime: "10:25", duration: 45, type: "academic", order: 3 },
      { name: "4th Period", label: "4th", startTime: "10:30", endTime: "11:15", duration: 45, type: "academic", order: 4 },
      { name: "5th Period", label: "5th", startTime: "11:20", endTime: "12:05", duration: 45, type: "academic", order: 5 },
      { name: "Lunch", label: "6th", startTime: "12:05", endTime: "12:35", duration: 30, type: "lunch", isTeaching: false, isCoverable: false, order: 6 },
      { name: "7th Period", label: "7th", startTime: "12:40", endTime: "13:25", duration: 45, type: "academic", order: 7 },
      { name: "8th Period", label: "8th", startTime: "13:30", endTime: "14:15", duration: 45, type: "academic", order: 8 },
      
      // Block periods (for block schedule)
      { name: "Block A", label: "A", startTime: "08:00", endTime: "09:30", duration: 90, type: "academic", order: 1 },
      { name: "Block B", label: "B", startTime: "09:35", endTime: "11:05", duration: 90, type: "academic", order: 2 },
      { name: "Lunch Block", label: "L", startTime: "11:05", endTime: "11:35", duration: 30, type: "lunch", isTeaching: false, isCoverable: false, order: 3 },
      { name: "Block C", label: "C", startTime: "11:40", endTime: "13:10", duration: 90, type: "academic", order: 4 },
      { name: "Block D", label: "D", startTime: "13:15", endTime: "14:45", duration: 90, type: "academic", order: 5 },
      
      // Advisory period
      { name: "Advisory", label: "ADV", startTime: "08:00", endTime: "08:20", duration: 20, type: "advisory", isTeaching: false, isCoverable: false, order: 0 }
    ];

    for (const config of periodConfigs) {
      await prisma.periodConfig.create({
        data: {
          ...config,
          schoolId: school.id
        }
      });
      console.log(`✅ Created period config: ${config.name}`);
    }

    // Step 3: Create Department Configurations
    console.log('\n🏢 Step 3: Creating Department Configurations...');
    
    const departmentConfigs = [
      {
        name: "Mathematics",
        code: "MATH",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 1,
        rules: {
          maxConsecutivePeriods: 3,
          preferredSubstitutes: [],
          subjectMatchRequired: true
        }
      },
      {
        name: "Science",
        code: "SCI",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 2,
        rules: {
          maxConsecutivePeriods: 3,
          preferredSubstitutes: [],
          subjectMatchRequired: true
        }
      },
      {
        name: "English",
        code: "ENG",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 3,
        rules: {
          maxConsecutivePeriods: 4,
          preferredSubstitutes: [],
          subjectMatchRequired: false
        }
      },
      {
        name: "History",
        code: "HIST",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 4,
        rules: {
          maxConsecutivePeriods: 4,
          preferredSubstitutes: [],
          subjectMatchRequired: false
        }
      },
      {
        name: "Foreign Languages",
        code: "FL",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: false,
        substituteCoverage: true,
        coveragePriority: 5,
        rules: {
          maxConsecutivePeriods: 3,
          preferredSubstitutes: [],
          subjectMatchRequired: true
        }
      },
      {
        name: "Physical Education",
        code: "PE",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 6,
        rules: {
          maxConsecutivePeriods: 5,
          preferredSubstitutes: [],
          subjectMatchRequired: false
        }
      },
      {
        name: "Arts",
        code: "ARTS",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: true,
        substituteCoverage: true,
        coveragePriority: 7,
        rules: {
          maxConsecutivePeriods: 4,
          preferredSubstitutes: [],
          subjectMatchRequired: false
        }
      },
      {
        name: "Music",
        code: "MUSIC",
        sameDepartmentCoverage: true,
        crossDepartmentCoverage: false,
        substituteCoverage: true,
        coveragePriority: 8,
        rules: {
          maxConsecutivePeriods: 3,
          preferredSubstitutes: [],
          subjectMatchRequired: true
        }
      }
    ];

    for (const config of departmentConfigs) {
      await prisma.departmentConfig.create({
        data: {
          ...config,
          schoolId: school.id
        }
      });
      console.log(`✅ Created department config: ${config.name}`);
    }

    // Step 4: Create Load Limit Configurations
    console.log('\n⚖️ Step 4: Creating Load Limit Configurations...');
    
    const loadLimitConfigs = [
      {
        name: "Standard Teacher Load",
        type: "teacher",
        maxPeriodsPerDay: 6,
        maxPeriodsPerWeek: 30,
        maxConsecutivePeriods: 4,
        minPrepPeriodsPerDay: 1,
        minLunchPeriodsPerDay: 1,
        constraints: {
          noFirstPeriod: false,
          noLastPeriod: false,
          maxCoveragePerWeek: 3,
          requirePrepPeriod: true
        }
      },
      {
        name: "Substitute Load",
        type: "substitute",
        maxPeriodsPerDay: 8,
        maxPeriodsPerWeek: 40,
        maxConsecutivePeriods: 6,
        minPrepPeriodsPerDay: 0,
        minLunchPeriodsPerDay: 1,
        constraints: {
          noFirstPeriod: false,
          noLastPeriod: false,
          maxCoveragePerWeek: 5,
          requirePrepPeriod: false
        }
      },
      {
        name: "Paraprofessional Load",
        type: "paraprofessional",
        maxPeriodsPerDay: 8,
        maxPeriodsPerWeek: 40,
        maxConsecutivePeriods: 8,
        minPrepPeriodsPerDay: 0,
        minLunchPeriodsPerDay: 1,
        constraints: {
          noFirstPeriod: false,
          noLastPeriod: false,
          maxCoveragePerWeek: 2,
          requirePrepPeriod: false
        }
      },
      {
        name: "Department Head Load",
        type: "department_head",
        maxPeriodsPerDay: 5,
        maxPeriodsPerWeek: 25,
        maxConsecutivePeriods: 3,
        minPrepPeriodsPerDay: 2,
        minLunchPeriodsPerDay: 1,
        constraints: {
          noFirstPeriod: true,
          noLastPeriod: false,
          maxCoveragePerWeek: 1,
          requirePrepPeriod: true
        }
      }
    ];

    for (const config of loadLimitConfigs) {
      await prisma.loadLimitConfig.create({
        data: {
          ...config,
          schoolId: school.id
        }
      });
      console.log(`✅ Created load limit config: ${config.name}`);
    }

    // Step 5: Create Constraint Configurations
    console.log('\n🚫 Step 5: Creating Constraint Configurations...');
    
    const constraintConfigs = [
      {
        name: "Union Coverage Limits",
        category: "union",
        ruleType: "hard",
        description: "Teachers cannot be assigned more than 3 coverage periods per week",
        conditions: {
          teacherRole: "teacher",
          maxCoveragePerWeek: 3
        },
        actions: {
          preventAssignment: true,
          requireApproval: false,
          message: "Union contract limits exceeded"
        },
        priority: 1
      },
      {
        name: "Department Head Protection",
        category: "policy",
        ruleType: "soft",
        description: "Department heads should not be assigned coverage during their prep periods",
        conditions: {
          teacherRole: "department_head",
          duringPrepPeriod: true
        },
        actions: {
          preventAssignment: false,
          requireApproval: true,
          message: "Department head prep period coverage requires approval"
        },
        priority: 2
      },
      {
        name: "Consecutive Period Limits",
        category: "safety",
        ruleType: "hard",
        description: "No teacher can be assigned more than 4 consecutive periods",
        conditions: {
          maxConsecutivePeriods: 4
        },
        actions: {
          preventAssignment: true,
          requireApproval: false,
          message: "Consecutive period limit exceeded"
        },
        priority: 3
      },
      {
        name: "Lunch Period Protection",
        category: "policy",
        ruleType: "hard",
        description: "Lunch periods cannot be used for coverage assignments",
        conditions: {
          periodType: "lunch"
        },
        actions: {
          preventAssignment: true,
          requireApproval: false,
          message: "Lunch periods are protected and cannot be used for coverage"
        },
        priority: 1
      },
      {
        name: "Subject Match Preference",
        category: "academic",
        ruleType: "preference",
        description: "Prefer substitutes with subject match when available",
        conditions: {
          substituteAvailable: true,
          subjectMatch: true
        },
        actions: {
          preventAssignment: false,
          requireApproval: false,
          boostPriority: true,
          message: "Subject match preferred"
        },
        priority: 4
      }
    ];

    for (const config of constraintConfigs) {
      await prisma.constraintConfig.create({
        data: {
          ...config,
          schoolId: school.id
        }
      });
      console.log(`✅ Created constraint config: ${config.name}`);
    }

    // Step 6: Assign load limit configurations to existing users
    console.log('\n👥 Step 6: Assigning load limit configurations to users...');
    
    const standardTeacherLoad = await prisma.loadLimitConfig.findFirst({
      where: { name: "Standard Teacher Load", schoolId: school.id }
    });
    
    const substituteLoad = await prisma.loadLimitConfig.findFirst({
      where: { name: "Substitute Load", schoolId: school.id }
    });
    
    const paraprofessionalLoad = await prisma.loadLimitConfig.findFirst({
      where: { name: "Paraprofessional Load", schoolId: school.id }
    });

    if (standardTeacherLoad) {
      await prisma.user.updateMany({
        where: { role: 'teacher', schoolId: school.id },
        data: { loadLimitConfigId: standardTeacherLoad.id }
      });
      console.log('✅ Assigned standard teacher load to teachers');
    }

    if (substituteLoad) {
      await prisma.substitute.updateMany({
        data: { loadLimitConfigId: substituteLoad.id }
      });
      console.log('✅ Assigned substitute load to substitutes');
    }

    if (paraprofessionalLoad) {
      await prisma.user.updateMany({
        where: { role: 'paraprofessional', schoolId: school.id },
        data: { loadLimitConfigId: paraprofessionalLoad.id }
      });
      console.log('✅ Assigned paraprofessional load to paraprofessionals');
    }

    console.log('\n🎉 School Configuration Setup Complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Schedule Configs: ${await prisma.scheduleConfig.count()}`);
    console.log(`   - Period Configs: ${await prisma.periodConfig.count()}`);
    console.log(`   - Department Configs: ${await prisma.departmentConfig.count()}`);
    console.log(`   - Load Limit Configs: ${await prisma.loadLimitConfig.count()}`);
    console.log(`   - Constraint Configs: ${await prisma.constraintConfig.count()}`);

  } catch (error) {
    console.error('❌ Error setting up school configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
};

setupSchoolConfiguration(); 