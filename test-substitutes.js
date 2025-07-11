const testSubstitutePriority = async () => {
  try {
    // First, let's get a real teacher ID from the database
    const teachersResponse = await fetch('http://localhost:3000/api/teachers');
    const teachers = await teachersResponse.json();
    
    if (!teachers.length) {
      console.log('No teachers found in database');
      return;
    }
    
    // Find a Science teacher to test with substitutes
    const scienceTeacher = teachers.find(t => t.department === 'Science');
    if (!scienceTeacher) {
      console.log('No Science teacher found');
      return;
    }
    
    console.log('Using Science teacher:', scienceTeacher.name);
    
    const response = await fetch('http://localhost:3000/api/absences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacherId: scienceTeacher.id,
        schoolId: scienceTeacher.schoolId,
        date: '2024-12-16T10:00:00.000Z', // Monday
        absenceType: 'sick',
        notes: 'Test absence - Periods: 1st, 2nd'
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Check if substitutes were assigned in Step 1
    const assignments = result.assignments || [];
    const substituteAssignments = assignments.filter(a => a.type === 'Substitute' && a.step === 1);
    
    if (substituteAssignments.length > 0) {
      console.log('✅ SUCCESS: Substitutes were assigned in Step 1!');
      substituteAssignments.forEach(assignment => {
        console.log(`  - ${assignment.period}: ${assignment.assigned} (Substitute - Step 1)`);
      });
    } else {
      console.log('❌ No substitutes assigned in Step 1. Check the algorithm logs above.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testSubstitutePriority(); 