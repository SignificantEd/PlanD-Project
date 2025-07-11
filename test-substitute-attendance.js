const testSubstituteAttendance = async () => {
  try {
    console.log('🧪 Testing Substitute Attendance Tracking...\n');

    // First, get an existing absence with coverage assignments
    const absencesResponse = await fetch('http://localhost:3001/api/absences');
    const absences = await absencesResponse.json();
    
    if (!absences.length) {
      console.log('❌ No absences found. Please create an absence first.');
      return;
    }

    const absence = absences[0];
    console.log(`📋 Using absence: ${absence.teacher.name} on ${new Date(absence.date).toLocaleDateString()}`);

    // Get coverage assignments for this absence
    const coverageResponse = await fetch(`http://localhost:3001/api/coverage?absenceId=${absence.id}`);
    const coverage = await coverageResponse.json();
    
    if (!coverage.assignments || !coverage.assignments.length) {
      console.log('❌ No coverage assignments found for this absence.');
      return;
    }

    // Find a substitute assignment
    const substituteAssignment = coverage.assignments.find(a => a.type === 'Substitute');
    if (!substituteAssignment) {
      console.log('❌ No substitute assignments found.');
      return;
    }

    console.log(`👤 Found substitute assignment: ${substituteAssignment.assigned} for ${substituteAssignment.period}`);

    // Test 1: Full Day Attendance
    console.log('\n✅ Test 1: Full Day Attendance');
    const fullDayResponse = await fetch('http://localhost:3001/api/substitutes/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        absenceId: absence.id,
        substituteId: substituteAssignment.assignedId,
        attendanceType: 'full'
      })
    });
    
    const fullDayResult = await fullDayResponse.json();
    console.log('Full Day Result:', fullDayResult);

    // Test 2: Half Day AM Attendance
    console.log('\n✅ Test 2: Half Day AM Attendance');
    const halfAmResponse = await fetch('http://localhost:3001/api/substitutes/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        absenceId: absence.id,
        substituteId: substituteAssignment.assignedId,
        attendanceType: 'half_am'
      })
    });
    
    const halfAmResult = await halfAmResponse.json();
    console.log('Half Day AM Result:', halfAmResult);

    // Test 3: Custom Periods Attendance
    console.log('\n✅ Test 3: Custom Periods Attendance');
    const customResponse = await fetch('http://localhost:3001/api/substitutes/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        absenceId: absence.id,
        substituteId: substituteAssignment.assignedId,
        attendanceType: 'custom',
        periodsWorked: ['1st', '2nd']
      })
    });
    
    const customResult = await customResponse.json();
    console.log('Custom Periods Result:', customResult);

    console.log('\n🎉 All substitute attendance tests completed!');

  } catch (error) {
    console.error('❌ Error testing substitute attendance:', error);
  }
};

testSubstituteAttendance(); 