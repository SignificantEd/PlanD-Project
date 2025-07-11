"use client"

import { useState } from 'react';

export default function TestCoveragePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const createTestAbsence = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Step 1: Create a test absence
      const absenceResponse = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: 'test-teacher-1', // We'll need to get a real teacher ID
          date: selectedDate,
          absenceType: 'Full Day',
          status: 'pending',
          periods: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
        })
      });
      
      if (!absenceResponse.ok) {
        throw new Error('Failed to create absence');
      }
      
      // Step 2: Run the coverage assignment
      const coverageResponse = await fetch('/api/admin/assign-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          dayType: 'A'
        })
      });
      
      const data = await coverageResponse.json();
      setResults(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🧪 Coverage Algorithm Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">📅 Test Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          
          <button
            onClick={createTestAbsence}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 w-full text-lg font-semibold"
          >
            {loading ? '⏳ Running Test...' : '🚀 Run Coverage Assignment Test'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">📊 Results</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-3xl font-bold text-blue-600">
                  {results.assignments?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Assignments Made</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="text-3xl font-bold text-green-600">
                  {results.coverageResults?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Coverage Results</div>
              </div>
            </div>

            {results.assignments && results.assignments.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-3">✅ Successful Assignments:</h3>
                <div className="space-y-2">
                  {results.assignments.map((assignment: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">
                        {assignment.assignedToName} → covers {assignment.absentTeacherName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Period: {assignment.period} | Type: {assignment.assignmentType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-yellow-800">
                  ⚠️ No assignments were made. This could mean:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>No substitutes are available</li>
                  <li>No teachers have free periods</li>
                  <li>There's a data matching issue</li>
                </ul>
              </div>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                🔍 View Raw Response
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 