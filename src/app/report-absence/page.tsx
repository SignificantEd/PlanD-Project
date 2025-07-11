'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sampleTeachers, defaultSettings } from '../../data/sampleData';
import { IAbsence } from '../../types/interfaces';

export default function ReportAbsencePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    teacherId: '',
    absenceType: 'Full Day',
    date: '',
    periodsToCover: [] as string[],
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAbsence, setSubmittedAbsence] = useState<IAbsence | null>(null);
  const [showPeriodSelection, setShowPeriodSelection] = useState(false);

  const absenceTypes = [
    'Full Day',
    'Half Day AM', 
    'Half Day PM',
    'Para',
    'Custom'
  ];

  // Update period selection visibility and auto-populate periods when absence type changes
  useEffect(() => {
    const selectedAbsenceType = defaultSettings.absenceTypes.find(
      type => type.name === formData.absenceType
    );

    if (selectedAbsenceType) {
      // Predefined absence type - auto-populate periods and hide selection
      setFormData(prev => ({
        ...prev,
        periodsToCover: selectedAbsenceType.periods
      }));
      setShowPeriodSelection(false);
    } else {
      // Custom absence type - show period selection and clear periods
      setFormData(prev => ({
        ...prev,
        periodsToCover: []
      }));
      setShowPeriodSelection(true);
    }
  }, [formData.absenceType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (period: string) => {
    setFormData(prev => ({
      ...prev,
      periodsToCover: prev.periodsToCover.includes(period)
        ? prev.periodsToCover.filter(p => p !== period)
        : [...prev.periodsToCover, period]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Find the selected teacher
    const selectedTeacher = sampleTeachers.find(t => t.id === formData.teacherId);
    
    if (!selectedTeacher) {
      alert('Please select a teacher');
      setIsSubmitting(false);
      return;
    }

    if (formData.periodsToCover.length === 0) {
      alert('Please select at least one period to cover');
      setIsSubmitting(false);
      return;
    }

    // Create the IAbsence object
    const newAbsence: IAbsence = {
      id: `absence-${Date.now()}`, // Generate a temporary ID
      teacherId: formData.teacherId,
      absentTeacherName: selectedTeacher.name,
      date: formData.date,
      type: formData.absenceType as any,
      periods: formData.periodsToCover, // For now, use periodsToCover as periods
      periodsToCover: formData.periodsToCover,
      status: 'Pending',
      manualOverride: {},
      notes: formData.notes,
      priority: formData.absenceType === 'Para' ? 1 : 
                formData.absenceType === 'Full Day' ? 2 :
                formData.absenceType.includes('Half Day') ? 3 : 4,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Log the created absence object
    console.log('🚀 New Absence Created:');
    console.log('========================');
    console.log('Absence Object:', newAbsence);
    console.log('Selected Teacher:', selectedTeacher);
    console.log('Form Data:', formData);
    console.log('========================');

    // Store the submitted absence for display
    setSubmittedAbsence(newAbsence);
    setIsSubmitting(false);

    // Encode the absence data for URL
    const encodedAbsenceData = encodeURIComponent(JSON.stringify(newAbsence));
    
    // Redirect to assignment results with the absence data
    router.push(`/assignment-results?absence=${encodedAbsenceData}`);
  };

  const resetForm = () => {
    setFormData({
      teacherId: '',
      absenceType: 'Full Day',
      date: '',
      periodsToCover: [],
      notes: ''
    });
    setSubmittedAbsence(null);
  };

  // Get the predefined periods for the selected absence type
  const getPredefinedPeriods = () => {
    const selectedAbsenceType = defaultSettings.absenceTypes.find(
      type => type.name === formData.absenceType
    );
    return selectedAbsenceType ? selectedAbsenceType.periods : [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Report Absence
          </h1>
          <p className="text-gray-600">
            Submit a new absence to trigger the coverage assignment algorithm
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Teacher Selection */}
            <div>
              <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-2">
                Absent Teacher *
              </label>
              <select
                id="teacherId"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a teacher...</option>
                {sampleTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Absence Type */}
            <div>
              <label htmlFor="absenceType" className="block text-sm font-medium text-gray-700 mb-2">
                Absence Type *
              </label>
              <select
                id="absenceType"
                name="absenceType"
                value={formData.absenceType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {absenceTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Absence *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Periods to Cover */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periods to Cover *
              </label>
              
              {/* Show predefined periods for Full Day/Half Day */}
              {!showPeriodSelection && formData.periodsToCover.length > 0 && (
                <div className="mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Predefined periods for {formData.absenceType}:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.periodsToCover.map(period => (
                        <span 
                          key={period}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {period}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Show period selection for Custom absences */}
              {showPeriodSelection && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {defaultSettings.periodNames.map(period => (
                      <label key={period} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.periodsToCover.includes(period)}
                          onChange={() => handlePeriodChange(period)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{period}</span>
                      </label>
                    ))}
                  </div>
                  {formData.periodsToCover.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one period</p>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about the absence..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || formData.teacherId === '' || formData.periodsToCover.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Absence'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reset
              </button>
            </div>

            {/* Assign Coverage Link */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center">
                <a
                  href="/absences/assign"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  📋 Go to Assign Coverage Page
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                View and manage coverage assignments for all absences
              </p>
            </div>
          </form>
        </div>

        {/* Submitted Absence Display */}
        {submittedAbsence && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              ✅ Absence Successfully Reported
            </h3>
            <div className="space-y-2 text-sm text-green-700">
              <p><strong>Teacher:</strong> {submittedAbsence.absentTeacherName}</p>
              <p><strong>Type:</strong> {submittedAbsence.type}</p>
              <p><strong>Date:</strong> {submittedAbsence.date}</p>
              <p><strong>Periods:</strong> {submittedAbsence.periodsToCover.join(', ')}</p>
              {submittedAbsence.notes && (
                <p><strong>Notes:</strong> {submittedAbsence.notes}</p>
              )}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                💡 <strong>Redirecting...</strong> You will be redirected to the Assignment Results page to see the coverage assignments for this absence.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Fill out all required fields marked with *</p>
            <p>• Full Day, Half Day AM/PM, and Para absences use predefined periods</p>
            <p>• Custom absences allow manual period selection</p>
            <p>• The form will create an IAbsence object and redirect to assignment results</p>
            <p>• Check the browser console (F12) for detailed absence object output</p>
          </div>
        </div>
      </div>
    </div>
  );
} 