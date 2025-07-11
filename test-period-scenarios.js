const { PrismaClient } = require('@prisma/client');

// Test script to demonstrate the three period matching scenarios
// Run with: node test-period-scenarios.js

async function testPeriodScenarios() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing PlanD Period Matching Scenarios...\n');
    
    // Helper function to simulate the period matching logic
    function getPeriodMatch(neededPeriods, availablePeriods) {
      const canCover = neededPeriods.filter(period => availablePeriods.includes(period));
      const cannotCover = neededPeriods.filter(period => !availablePeriods.includes(period));
      
      let matchType;
      if (canCover.length === 0) {
        matchType = 'none';
      } else if (canCover.length === neededPeriods.length) {
        matchType = 'perfect';
      } else {
        matchType = 'partial';
      }
      
      return { canCover, cannotCover, matchType };
    }
    
    // Test Scenario 1: Abs Teacher Periods = Sub Teacher Periods
    console.log('=== SCENARIO 1: Perfect Match ===');
    console.log('Absent Teacher needs: ["1st", "2nd", "3rd"]');
    console.log('Substitute available: ["1st", "2nd", "3rd"]');
    
    const scenario1 = getPeriodMatch(['1st', '2nd', '3rd'], ['1st', '2nd', '3rd']);
    console.log('Result:', scenario1);
    console.log('Coverage: ALL PERIODS COVERED');
    console.log('');
    
    // Test Scenario 2: Abs Teacher Periods < Sub Teacher Periods
    console.log('=== SCENARIO 2: Substitute Has Extra Availability ===');
    console.log('Absent Teacher needs: ["1st", "2nd"]');
    console.log('Substitute available: ["1st", "2nd", "3rd", "4th"]');
    
    const scenario2 = getPeriodMatch(['1st', '2nd'], ['1st', '2nd', '3rd', '4th']);
    console.log('Result:', scenario2);
    console.log('Coverage: ALL PERIODS COVERED (substitute has extra availability)');
    console.log('');
    
    // Test Scenario 3: Abs Teacher Periods > Sub Teacher Periods
    console.log('=== SCENARIO 3: Partial Coverage ===');
    console.log('Absent Teacher needs: ["1st", "2nd", "3rd", "4th"]');
    console.log('Substitute available: ["1st", "2nd"]');
    
    const scenario3 = getPeriodMatch(['1st', '2nd', '3rd', '4th'], ['1st', '2nd']);
    console.log('Result:', scenario3);
    console.log('Coverage: PARTIAL - periods 3rd and 4th need additional coverage');
    console.log('');
    
    // Test Scenario 4: No Match
    console.log('=== SCENARIO 4: No Match ===');
    console.log('Absent Teacher needs: ["1st", "2nd", "3rd"]');
    console.log('Substitute available: ["4th", "5th", "6th"]');
    
    const scenario4 = getPeriodMatch(['1st', '2nd', '3rd'], ['4th', '5th', '6th']);
    console.log('Result:', scenario4);
    console.log('Coverage: NO COVERAGE - substitute not available for any needed periods');
    console.log('');
    
    // Test with real data from database
    console.log('=== TESTING WITH REAL DATA ===');
    
    // Get a sample absence
    const absences = await prisma.absence.findMany({
      where: { status: 'pending' },
      take: 1
    });
    
    if (absences.length > 0) {
      const absence = absences[0];
      const teacher = await prisma.user.findUnique({
        where: { id: absence.teacherId }
      });
      
      console.log(`Testing with absence for ${teacher?.name}:`);
      
      // Get periods from master schedule
      const dayOfWeek = getDayOfWeek(new Date(absence.date));
      const msEntries = await prisma.masterSchedule.findMany({ 
        where: { teacherId: absence.teacherId, dayOfWeek, isTeaching: true } 
      });
      const neededPeriods = msEntries.map(ms => ms.period);
      
      console.log(`Needed periods: ${JSON.stringify(neededPeriods)}`);
      
      // Get substitutes and their availability
      const substitutes = await prisma.substitute.findMany();
      
      for (const sub of substitutes.slice(0, 3)) { // Test first 3 substitutes
        const availability = typeof sub.availability === 'string' 
          ? JSON.parse(sub.availability) 
          : sub.availability;
        const dayAvail = availability[dayOfWeek] || [];
        
        const match = getPeriodMatch(neededPeriods, dayAvail);
        
        console.log(`\nSubstitute: ${sub.name}`);
        console.log(`Available: ${JSON.stringify(dayAvail)}`);
        console.log(`Match: ${match.matchType}`);
        console.log(`Can cover: ${JSON.stringify(match.canCover)}`);
        console.log(`Cannot cover: ${JSON.stringify(match.cannotCover)}`);
      }
    } else {
      console.log('No pending absences found in database.');
    }
    
  } catch (error) {
    console.error('Error testing period scenarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getDayOfWeek(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Run the test
testPeriodScenarios(); 