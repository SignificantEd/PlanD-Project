"use client"

import { useState, useEffect } from 'react';

export default function AlgorithmTestPage() {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceType, setAbsenceType] = useState('Full Day');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  // Load teachers on component mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Update periods when absence type changes
  useEffect(() => {
    switch (absenceType) {
      case 'Full Day':
        setSelectedPeriods(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']);
        break;
      case 'Half Day AM':
        setSelectedPeriods(['1st', '2nd', '3rd', '4th']);
        break;
      case 'Half Day PM':
        setSelectedPeriods(['5th', '6th', '7th', '8th']);
        break;
      // Custom keeps whatever is selected
    }
  }, [absenceType]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      setTeachers(data);
      if (data.length > 0) {
        setSelectedTeacher(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const runTest = async () => {
    try {
      setLoading(true);
      setError('');
      setResults(null);

      // Step 1: Create an absence
      console.log('Creating absence for teacher:', selectedTeacher);
      const absenceResponse = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          schoolId: 'debug-school-1', // Using the schoolId from our seed data
          date: selectedDate,
          absenceType: absenceType,
          status: 'pending',
          periods: selectedPeriods
        })
      });

      if (!absenceResponse.ok) {
        const errorData = await absenceResponse.json();
        throw new Error(errorData.error || 'Failed to create absence');
      }

      const absenceData = await absenceResponse.json();
      console.log('Absence created:', absenceData);

      // Step 2: Run coverage assignment
      console.log('Running coverage assignment...');
      const coverageResponse = await fetch('/api/admin/assign-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          dayType: 'A'
        })
      });

      const coverageData = await coverageResponse.json();
      console.log('Coverage results:', coverageData);
      setResults(coverageData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 text-center text-gray-800">
          🧪 Coverage Algorithm Test Lab
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test the substitute assignment algorithm with real data
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Test Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="text-3xl mr-2">⚙️</span> Test Configuration
            </h2>

            {/* Teacher Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher to be Absent:
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.department || 'No Department'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Absence Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Absence Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Absence Type:
              </label>
              <select
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full Day">Full Day</option>
                <option value="Half Day AM">Half Day AM (Periods 1-4)</option>
                <option value="Half Day PM">Half Day PM (Periods 5-8)</option>
                <option value="Custom">Custom (Select Below)</option>
              </select>
            </div>

            {/* Period Selection (only show for Custom) */}
            {absenceType === 'Custom' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Periods to Cover:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {periods.map((period) => (
                    <label key={period} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPeriods.includes(period)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPeriods([...selectedPeriods, period]);
                          } else {
                            setSelectedPeriods(selectedPeriods.filter(p => p !== period));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{period}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Show selected periods for non-custom types */}
            {absenceType !== 'Custom' && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Periods to cover:</strong> {selectedPeriods.join(', ')}
                </p>
              </div>
            )}

            {/* Run Test Button */}
            <button
              onClick={runTest}
              disabled={loading || !selectedTeacher || selectedPeriods.length === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running Algorithm...
                </>
              ) : (
                '🚀 Run Coverage Assignment'
              )}
            </button>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="text-3xl mr-2">📊</span> Results
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <strong>❌ Error:</strong> {error}
              </div>
            )}

            {!results && !error && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎯</div>
                <p>Run a test to see results here</p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {results.assignments?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Assignments Made</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {results.totalCandidatesEvaluated || 0}
                    </div>
                    <div className="text-sm text-gray-600">Candidates Evaluated</div>
                  </div>
                </div>

                {/* Assignment Details */}
                {results.assignments && results.assignments.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-2">✅ Coverage Assignments:</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {results.assignments.map((assignment: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-green-700">
                                {assignment.assignedToName}
                              </div>
                              <div className="text-sm text-gray-600">
                                covers <span className="font-medium">{assignment.absentTeacherName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600">
                                {assignment.period}
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.assignmentType}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800 font-medium mb-2">
                      ⚠️ No assignments were made
                    </p>
                    <p className="text-sm text-yellow-700">
                      This usually means no substitutes or teachers were available for the selected periods.
                    </p>
                  </div>
                )}

                {/* Processing Time */}
                {results.processingTime && (
                  <div className="text-sm text-gray-500 text-center pt-2">
                    ⏱️ Processed in {results.processingTime}ms
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        {results && (
          <details className="mt-8 bg-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              🔍 View Full Response Data
            </summary>
            <pre className="mt-4 text-xs bg-white p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 