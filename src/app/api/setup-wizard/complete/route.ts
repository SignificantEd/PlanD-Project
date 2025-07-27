import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const wizardData = await request.json();
    
    console.log('🧙 Processing Setup Wizard Data...');
    
    // Validate required data
    if (!wizardData.schoolInfo?.name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }
    
    // Start a transaction for all database operations
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create school (check if exists first)
      console.log('🏫 Creating school...');
      
      // Check if school already exists
      let school = await tx.school.findFirst({
        where: { name: wizardData.schoolInfo.name }
      });
      
      if (school) {
        // Update existing school
        school = await tx.school.update({
          where: { id: school.id },
          data: {
            location: wizardData.schoolInfo.location,
            type: wizardData.schoolInfo.type,
            settings: {
              studentCount: wizardData.schoolInfo.studentCount,
              coverageResponsibility: wizardData.schoolInfo.coverageResponsibility,
              primaryContact: wizardData.schoolInfo.contact,
              periods: wizardData.scheduleConfig?.periods || [],
              cycleDays: wizardData.scheduleConfig?.cycleDays || [],
              halfDays: wizardData.scheduleConfig?.halfDays || [],
              lunchPeriods: wizardData.scheduleConfig?.lunchPeriods || [],
              roomSharing: wizardData.scheduleConfig?.roomSharing || false,
              ...wizardData.coverageRules?.constraints
            }
          }
        });
      } else {
        // Create new school
        school = await tx.school.create({
          data: {
            name: wizardData.schoolInfo.name,
            location: wizardData.schoolInfo.location,
            type: wizardData.schoolInfo.type,
            settings: {
              studentCount: wizardData.schoolInfo.studentCount,
              coverageResponsibility: wizardData.schoolInfo.coverageResponsibility,
              primaryContact: wizardData.schoolInfo.contact,
              periods: wizardData.scheduleConfig?.periods || [],
              cycleDays: wizardData.scheduleConfig?.cycleDays || [],
              halfDays: wizardData.scheduleConfig?.halfDays || [],
              lunchPeriods: wizardData.scheduleConfig?.lunchPeriods || [],
              roomSharing: wizardData.scheduleConfig?.roomSharing || false,
              ...wizardData.coverageRules?.constraints
            }
          }
        });
      }

      // Step 2: Create schedule configurations
      if (wizardData.scheduleConfig?.periods?.length > 0) {
        console.log('📅 Creating schedule configurations...');
        
        // Create schedule config
        await tx.scheduleConfig.create({
          data: {
            name: "Wizard Setup Schedule",
            type: "traditional",
            description: "Schedule created via setup wizard",
            config: {
              days: wizardData.scheduleConfig.cycleDays,
              periods: wizardData.scheduleConfig.periods,
              halfDays: wizardData.scheduleConfig.halfDays,
              lunchPeriods: wizardData.scheduleConfig.lunchPeriods,
              roomSharing: wizardData.scheduleConfig.roomSharing
            },
            schoolId: school.id,
            isActive: true
          }
        });

        // Create period configurations
        for (const [index, period] of wizardData.scheduleConfig.periods.entries()) {
          await tx.periodConfig.create({
            data: {
              name: period.name,
              label: period.name,
              startTime: period.start,
              endTime: period.end,
              duration: calculateDuration(period.start, period.end),
              type: wizardData.scheduleConfig.lunchPeriods.includes(period.name) ? 'lunch' : 'academic',
              isTeaching: !wizardData.scheduleConfig.lunchPeriods.includes(period.name),
              isCoverable: !wizardData.scheduleConfig.lunchPeriods.includes(period.name),
              order: index + 1,
              schoolId: school.id
            }
          });
        }
      }

      // Step 3: Create staff members
      if (wizardData.staffUpload?.teachers?.length > 0) {
        console.log('👥 Creating staff members...');
        
        for (const teacher of wizardData.staffUpload.teachers) {
          await tx.user.create({
            data: {
              name: teacher.name,
              email: teacher.email,
              password: '$2a$10$defaulthashedpassword', // Default password - should be changed on first login
              department: teacher.department,
              role: teacher.role,
              schoolId: school.id
            }
          });
        }
      }

      // Step 4: Create substitute teachers
      if (wizardData.substitutePool?.substitutes?.length > 0) {
        console.log('🎓 Creating substitute teachers...');
        
        for (const substitute of wizardData.substitutePool.substitutes) {
          await tx.substitute.create({
            data: {
              name: substitute.name,
              email: substitute.email,
              cell: substitute.phone || '',
              subjectSpecialties: substitute.subjectSpecialties,
              availability: substitute.availability
            }
          });
        }
      }

      // Step 5: Create coverage configuration rules
      if (wizardData.coverageRules?.constraints) {
        console.log('⚙️ Creating coverage rules...');
        
        const constraints = wizardData.coverageRules.constraints;
        
        // Create load limit configurations
        const loadLimitConfigs = [
          {
            name: "Standard Teacher Load",
            type: "teacher",
            maxPeriodsPerDay: 6,
            maxPeriodsPerWeek: 30,
            maxConsecutivePeriods: constraints.maxConsecutivePeriods,
            minPrepPeriodsPerDay: 1,
            minLunchPeriodsPerDay: 1,
            constraints: {
              noFirstPeriod: false,
              noLastPeriod: false,
              maxCoveragePerWeek: constraints.maxInternalCoverageNormal * 5, // per week
              requirePrepPeriod: !constraints.preventPrepCoverage
            }
          },
          {
            name: "Substitute Load",
            type: "substitute",
            maxPeriodsPerDay: constraints.maxSubstituteCoverage,
            maxPeriodsPerWeek: constraints.maxSubstituteCoverage * 5,
            maxConsecutivePeriods: constraints.maxConsecutivePeriods,
            minPrepPeriodsPerDay: 0,
            minLunchPeriodsPerDay: constraints.preventLunchCoverage ? 1 : 0,
            constraints: {
              noFirstPeriod: false,
              noLastPeriod: false,
              maxCoveragePerWeek: constraints.maxSubstituteCoverage * 5,
              requirePrepPeriod: false
            }
          }
        ];

        for (const config of loadLimitConfigs) {
          await tx.loadLimitConfig.create({
            data: {
              ...config,
              schoolId: school.id
            }
          });
        }

        // Create constraint configurations
        const constraintConfigs = [
          {
            name: "Union Coverage Limits",
            category: "union",
            ruleType: "hard",
            description: "Teachers cannot be assigned more than configured coverage periods per week",
            conditions: {
              teacherRole: "teacher",
              maxCoveragePerWeek: constraints.maxInternalCoverageNormal * 5
            },
            actions: {
              preventAssignment: constraints.unionCompliance,
              requireApproval: constraints.approvalRequired,
              message: "Union contract limits exceeded"
            },
            priority: 1
          },
          {
            name: "Lunch Period Protection",
            category: "policy",
            ruleType: constraints.preventLunchCoverage ? "hard" : "soft",
            description: "Lunch periods protection policy",
            conditions: {
              periodType: "lunch"
            },
            actions: {
              preventAssignment: constraints.preventLunchCoverage,
              requireApproval: false,
              message: "Lunch periods are protected"
            },
            priority: 1
          },
          {
            name: "Prep Period Protection",
            category: "policy",
            ruleType: constraints.preventPrepCoverage ? "hard" : "soft",
            description: "Preparation period protection policy",
            conditions: {
              periodType: "prep"
            },
            actions: {
              preventAssignment: constraints.preventPrepCoverage,
              requireApproval: constraints.approvalRequired,
              message: "Preparation periods are protected"
            },
            priority: 2
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
              boostPriority: constraints.subjectMatchPreference,
              message: "Subject match preferred"
            },
            priority: 4
          }
        ];

        for (const config of constraintConfigs) {
          await tx.constraintConfig.create({
            data: {
              ...config,
              schoolId: school.id
            }
          });
        }
      }

      return {
        schoolId: school.id,
        schoolName: school.name,
        staffCount: wizardData.staffUpload?.teachers?.length || 0,
        substituteCount: wizardData.substitutePool?.substitutes?.length || 0,
        periodCount: wizardData.scheduleConfig?.periods?.length || 0
      };
    });

    console.log('✅ Setup Wizard completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - School: ${result.schoolName}`);
    console.log(`   - Staff: ${result.staffCount}`);
    console.log(`   - Substitutes: ${result.substituteCount}`);
    console.log(`   - Periods: ${result.periodCount}`);

    return NextResponse.json({
      success: true,
      message: 'School setup completed successfully!',
      data: result
    });

  } catch (error) {
    console.error('❌ Setup Wizard error:', error);
    return NextResponse.json(
      { error: 'Setup failed. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function calculateDuration(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return endMinutes - startMinutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
