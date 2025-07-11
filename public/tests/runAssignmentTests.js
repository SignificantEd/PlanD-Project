// Standalone test script for PlanD Assignment Logic
// This file runs directly in the browser and tests the assignment algorithm
// Sample data
const sampleTeachers = [
    {
        id: 'teacher1',
        name: 'John Smith',
        department: 'Math',
        email: 'john.smith@school.edu',
        phone: '555-0001',
        schedule: { '1A': 'Algebra 1', '2A': 'Prep', '3A': 'Geometry', '4A': 'Lunch', '5A': 'Algebra 2', '6A': 'PLC' },
        assignedCoverageCount: 0,
        isInternal: true,
        isPara: false,
        maxLoad: 5,
        maxWeeklyLoad: 10,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'teacher2',
        name: 'Jane Doe',
        department: 'Science',
        email: 'jane.doe@school.edu',
        phone: '555-0002',
        schedule: { '1A': 'Biology', '2A': 'Chemistry', '3A': 'Prep', '4A': 'Lunch', '5A': 'Physics', '6A': 'PLC' },
        assignedCoverageCount: 0,
        isInternal: true,
        isPara: false,
        maxLoad: 4,
        maxWeeklyLoad: 8,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
const sampleSubstitutes = [
    {
        id: 'sub1',
        name: 'Alice Johnson',
        email: 'alice.johnson@subs.edu',
        phone: '555-0101',
        qualifications: ['Math', 'Science'],
        availability: { 'A': ['1', '2', '3', '4', '5', '6'], 'B': ['1', '2', '3', '4', '5', '6'] },
        assignedCoverageCount: 0,
        isInternal: false,
        maxDailyLoad: 6,
        maxWeeklyLoad: 20,
        preferredTeacherId: 'teacher1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'sub2',
        name: 'Bob Wilson',
        email: 'bob.wilson@subs.edu',
        phone: '555-0102',
        qualifications: ['English', 'History'],
        availability: { 'A': ['1', '2', '3'], 'B': ['1', '2', '3'] },
        assignedCoverageCount: 0,
        isInternal: false,
        maxDailyLoad: 4,
        maxWeeklyLoad: 15,
        preferredTeacherId: 'teacher2',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
const sampleAbsences = [
    {
        id: 'absence1',
        teacherId: 'teacher1',
        absentTeacherName: 'John Smith',
        date: '2025-01-15',
        dayType: 'A',
        type: 'Full Day',
        periods: ['1A', '2A', '3A', '4A', '5A', '6A'],
        periodsToCover: ['1A', '3A', '5A'],
        status: 'Pending',
        manualOverride: {},
        notes: 'Personal day',
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'absence2',
        teacherId: 'teacher2',
        absentTeacherName: 'Jane Doe',
        date: '2025-01-15',
        dayType: 'A',
        type: 'Half Day AM',
        periods: ['1A', '2A', '3A'],
        periodsToCover: ['1A', '2A'],
        status: 'Pending',
        manualOverride: {},
        notes: 'Doctor appointment',
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
// Helper function to check if substitute is available for coverage
function isAvailableForCoverage(substitute, absence) {
    // Check if substitute is available for the day type and periods
    const dayType = absence.dayType;
    const availablePeriods = substitute.availability[dayType] || [];
    // Check if substitute can cover any of the periods that need coverage
    return absence.periodsToCover.some(period => {
        const periodNumber = period.replace(/[AB]$/, ''); // Extract just the number
        return availablePeriods.includes(periodNumber) || availablePeriods.includes('Full Day');
    });
}
// Helper function to sort absences by priority
function sortAbsencesByPriority(absences) {
    return absences.sort((a, b) => {
        // Lower priority number = higher priority
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        // More periods to cover gets higher priority
        if (a.periodsToCover.length !== b.periodsToCover.length) {
            return b.periodsToCover.length - a.periodsToCover.length;
        }
        // Earlier date gets higher priority
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
}
// Core assignment function
function assignCoverage(absences, substitutes, teachers) {
    console.log('=== STARTING COVERAGE ASSIGNMENT ===');
    console.log('Input absences:', absences);
    console.log('Available substitutes:', substitutes);
    console.log('Teachers:', teachers);
    const assignments = [];
    const sortedAbsences = sortAbsencesByPriority(absences);
    console.log('Sorted absences by priority:', sortedAbsences);
    for (const absence of sortedAbsences) {
        console.log(`\n--- Processing absence ${absence.id} for teacher ${absence.teacherId} ---`);
        console.log(`Periods to cover: ${absence.periodsToCover.join(', ')}`);
        // Find available substitutes for this absence
        const availableSubstitutes = substitutes.filter(sub => isAvailableForCoverage(sub, absence));
        console.log(`Available substitutes: ${availableSubstitutes.map(s => s.name).join(', ')}`);
        if (availableSubstitutes.length === 0) {
            console.log('❌ No available substitutes found for this absence');
            continue;
        }
        // Find the teacher for this absence
        const teacher = teachers.find(t => t.id === absence.teacherId);
        if (!teacher) {
            console.log(`❌ Teacher ${absence.teacherId} not found`);
            continue;
        }
        // Sort substitutes by preference (preferred teacher first)
        const sortedSubstitutes = availableSubstitutes.sort((a, b) => {
            const aIsPreferred = a.preferredTeacherId === absence.teacherId;
            const bIsPreferred = b.preferredTeacherId === absence.teacherId;
            if (aIsPreferred && !bIsPreferred)
                return -1;
            if (!aIsPreferred && bIsPreferred)
                return 1;
            return 0;
        });
        console.log(`Sorted substitutes by preference: ${sortedSubstitutes.map(s => s.name).join(', ')}`);
        // Assign coverage for each period
        for (const period of absence.periodsToCover) {
            console.log(`\n  Assigning period: ${period}`);
            // Find best available substitute for this period
            let assignedSubstitute = null;
            for (const substitute of sortedSubstitutes) {
                // Check if substitute is already assigned to this period on this date
                const alreadyAssigned = assignments.some(assignment => assignment.assignedToId === substitute.id &&
                    assignment.date === absence.date &&
                    assignment.period === period);
                if (!alreadyAssigned) {
                    assignedSubstitute = substitute;
                    break;
                }
            }
            if (assignedSubstitute) {
                const assignment = {
                    id: `assignment-${absence.id}-${period}`,
                    absenceId: absence.id,
                    absentTeacherId: absence.teacherId,
                    absentTeacherName: absence.absentTeacherName,
                    period: period,
                    assignedToId: assignedSubstitute.id,
                    assignedToName: assignedSubstitute.name,
                    assignmentType: 'External Sub',
                    date: absence.date,
                    status: 'Pending Approval',
                    notes: `Auto-assigned to ${assignedSubstitute.name}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                assignments.push(assignment);
                console.log(`  ✅ Assigned ${period} to ${assignedSubstitute.name}`);
            }
            else {
                console.log(`  ❌ No available substitute for period ${period}`);
            }
        }
    }
    console.log('\n=== COVERAGE ASSIGNMENT COMPLETE ===');
    console.log(`Total assignments made: ${assignments.length}`);
    return assignments;
}
// Test function that runs all tests
function runAllAssignmentTests() {
    console.log('🚀 STARTING PLAN D ASSIGNMENT TESTS 🚀');
    console.log('==========================================');
    // Step 0: Test helper functions
    console.log('\n📋 STEP 0: Testing Helper Functions');
    console.log('------------------------------------');
    const testAbsence = {
        id: 'test1',
        teacherId: 'teacher1',
        absentTeacherName: 'John Smith',
        date: '2025-01-15', // Wednesday
        dayType: 'A',
        type: 'Full Day',
        periods: ['1A', '2A'],
        periodsToCover: ['1A', '2A'],
        status: 'Pending',
        manualOverride: {},
        notes: 'Test',
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    console.log('Testing isAvailableForCoverage:');
    console.log(`Substitute 1 available: ${isAvailableForCoverage(sampleSubstitutes[0], testAbsence)}`);
    console.log(`Substitute 2 available: ${isAvailableForCoverage(sampleSubstitutes[1], testAbsence)}`);
    console.log('\nTesting sortAbsencesByPriority:');
    const sortedTest = sortAbsencesByPriority([...sampleAbsences]);
    console.log('Sorted absences:', sortedTest.map(a => `${a.id} (${a.type})`));
    // Step 1: Test with single absence
    console.log('\n📋 STEP 1: Single Absence Test');
    console.log('--------------------------------');
    const singleAbsence = [sampleAbsences[0]];
    const assignments1 = assignCoverage(singleAbsence, sampleSubstitutes, sampleTeachers);
    console.log('Step 1 assignments:', assignments1);
    // Step 2: Test with multiple absences
    console.log('\n📋 STEP 2: Multiple Absences Test');
    console.log('----------------------------------');
    const assignments2 = assignCoverage(sampleAbsences, sampleSubstitutes, sampleTeachers);
    console.log('Step 2 assignments:', assignments2);
    // Step 3: Test with conflicting assignments
    console.log('\n📋 STEP 3: Conflicting Assignments Test');
    console.log('----------------------------------------');
    const conflictingAbsences = [
        {
            id: 'conflict1',
            teacherId: 'teacher1',
            absentTeacherName: 'John Smith',
            date: '2025-01-15',
            dayType: 'A',
            type: 'Full Day',
            periods: ['1A', '2A'],
            periodsToCover: ['1A', '2A'],
            status: 'Pending',
            manualOverride: {},
            notes: 'Conflict test 1',
            priority: 2,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'conflict2',
            teacherId: 'teacher2',
            absentTeacherName: 'Jane Doe',
            date: '2025-01-15',
            dayType: 'A',
            type: 'Full Day',
            periods: ['1A', '2A'],
            periodsToCover: ['1A', '2A'],
            status: 'Pending',
            manualOverride: {},
            notes: 'Conflict test 2',
            priority: 2,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    const assignments3 = assignCoverage(conflictingAbsences, sampleSubstitutes, sampleTeachers);
    console.log('Step 3 assignments:', assignments3);
    // Final summary
    console.log('\n🎯 TEST SUMMARY');
    console.log('===============');
    console.log(`Step 1 assignments: ${assignments1.length}`);
    console.log(`Step 2 assignments: ${assignments2.length}`);
    console.log(`Step 3 assignments: ${assignments3.length}`);
    console.log('\n✅ All tests completed! Check the detailed logs above.');
}
// Run the tests immediately when this file is loaded
runAllAssignmentTests();
