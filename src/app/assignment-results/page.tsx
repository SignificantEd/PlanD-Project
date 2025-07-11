'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Import the assignment logic and sample data
import { assignCoverage } from '../../utils/assignmentLogic';
import { sampleAbsences, sampleTeachers, sampleSubstitutes, defaultSettings } from '../../data/sampleData';
import { IAbsence } from '../../types/interfaces';

interface AssignmentResult {
  absentTeacherName: string;
  period: string;
  assignedToName: string;
  assignmentType: string;
  isEmergency: boolean;
}

export default function AssignmentResultsPage() {
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<AssignmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedAbsence, setProcessedAbsence] = useState<IAbsence | null>(null);
  const [isSingleAbsence, setIsSingleAbsence] = useState(false);

  useEffect(() => {
    try {
      console.log('🚀 Running assignment logic...');
      
      // Check if we have an absence in the query parameters
      const absenceParam = searchParams.get('absence');
      let absencesToProcess: IAbsence[];
      let singleAbsence: IAbsence | null = null;
      
      if (absenceParam) {
        try {
          // Decode and parse the absence data
          const decodedAbsence = decodeURIComponent(absenceParam);
          singleAbsence = JSON.parse(decodedAbsence);
          if (singleAbsence) {
            absencesToProcess = [singleAbsence];
            setIsSingleAbsence(true);
            setProcessedAbsence(singleAbsence);
          } else {
            throw new Error('Parsed absence is null');
          }
          
          console.log('📝 Processing single absence from form:', singleAbsence);
        } catch (parseError) {
          console.error('❌ Error parsing absence data:', parseError);
          // Fallback to sample absences if parsing fails
          absencesToProcess = sampleAbsences;
          setIsSingleAbsence(false);
          console.log('🔄 Falling back to sample absences due to parsing error');
        }
      } else {
        // No absence parameter, use sample absences
        absencesToProcess = sampleAbsences;
        setIsSingleAbsence(false);
        console.log('📊 Processing sample absences (default mode)');
      }
      
      // Run the assignment logic
      const { assignmentsLog } = assignCoverage(
        absencesToProcess,
        sampleTeachers,
        sampleSubstitutes,
        defaultSettings
      );

      console.log('📊 Assignment results:', assignmentsLog);

      // Transform the assignments log into a format suitable for display
      const formattedAssignments: AssignmentResult[] = assignmentsLog.map((assignment: any) => ({
        absentTeacherName: assignment.absentTeacherName || 'Unknown',
        period: assignment.period || 'Unknown',
        assignedToName: assignment.assignedToName || 'Unassigned',
        assignmentType: assignment.assignmentType || 'Unknown',
        isEmergency: assignment.isEmergency || false
      }));

      setAssignments(formattedAssignments);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error running assignment logic:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running assignment algorithm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Running Assignment Logic</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 PlanD Assignment Results
          </h1>
          <p className="text-gray-600">
            {isSingleAbsence 
              ? `Coverage assignments for ${processedAbsence?.absentTeacherName}'s absence`
              : 'Coverage assignments generated by the PlanD algorithm'
            }
          </p>
        </div>

        {/* Single Absence Info */}
        {isSingleAbsence && processedAbsence && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">
              📝 Processed Absence Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Teacher:</span>
                <p className="text-blue-600">{processedAbsence.absentTeacherName}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Date:</span>
                <p className="text-blue-600">{processedAbsence.date}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Type:</span>
                <p className="text-blue-600">{processedAbsence.type}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Periods:</span>
                <p className="text-blue-600">{processedAbsence.periodsToCover.join(', ')}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Priority:</span>
                <p className="text-blue-600">{processedAbsence.priority}</p>
              </div>
              {processedAbsence.notes && (
                <div>
                  <span className="font-medium text-blue-700">Notes:</span>
                  <p className="text-blue-600">{processedAbsence.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
              <div className="text-sm text-blue-600">Total Assignments</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.assignedToName !== 'Unassigned').length}
              </div>
              <div className="text-sm text-green-600">Successfully Assigned</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter(a => a.isEmergency).length}
              </div>
              <div className="text-sm text-yellow-600">Emergency Assignments</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(assignments.map(a => a.absentTeacherName)).size}
              </div>
              <div className="text-sm text-purple-600">Teachers Covered</div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
          </div>
          
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No assignments were generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emergency
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment, index) => (
                    <tr 
                      key={index}
                      className={assignment.isEmergency ? 'bg-red-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.absentTeacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={assignment.assignedToName === 'Unassigned' ? 'text-red-600 font-medium' : ''}>
                          {assignment.assignedToName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.assignmentType === 'Manual Override' 
                            ? 'bg-purple-100 text-purple-800'
                            : assignment.assignmentType === 'External Sub'
                            ? 'bg-blue-100 text-blue-800'
                            : assignment.assignmentType === 'Internal Coverage'
                            ? 'bg-green-100 text-green-800'
                            : assignment.assignmentType === 'Emergency Coverage'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.assignmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.isEmergency ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Total assignments processed: {assignments.length}</p>
            <p>• Processing mode: {isSingleAbsence ? 'Single absence from form' : 'Sample absences (default)'}</p>
            <p>• Check browser console for detailed algorithm logs</p>
            <p>• Emergency assignments are highlighted in red</p>
          </div>
        </div>
      </div>
    </div>
  );
} 