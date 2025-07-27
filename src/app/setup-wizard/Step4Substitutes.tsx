import { useState, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { SubstitutePool } from './types';
import { 
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function Step4Substitutes() {
  const { wizardData, updateStepData } = useWizard();
  const [formData, setFormData] = useState<SubstitutePool>({
    substitutes: [],
    ...wizardData.substitutePool
  });

  useEffect(() => {
    updateStepData(4, formData);
  }, [formData]);

  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Foreign Languages',
    'Physical Education', 'Arts', 'Music', 'Special Education', 'General'
  ];

  const certificationLevels = [
    { value: 'emergency', label: 'Emergency Certificate' },
    { value: 'substitute', label: 'Substitute Certificate' },
    { value: 'standard', label: 'Standard Teaching Certificate' },
    { value: 'professional', label: 'Professional Certificate' }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const addSubstitute = () => {
    const newSubstitute = {
      id: `sub-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      subjectSpecialties: [],
      certificationLevel: 'substitute',
      availability: {
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true
      },
      maxPeriodsPerDay: 6,
      preferredSchools: [],
      rating: 0,
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      substitutes: [...prev.substitutes, newSubstitute]
    }));
  };

  const removeSubstitute = (id: string) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.filter(sub => sub.id !== id)
    }));
  };

  const updateSubstitute = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.map(sub => 
        sub.id === id ? { ...sub, [field]: value } : sub
      )
    }));
  };

  const toggleSubjectSpecialty = (subId: string, subject: string) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.map(sub => {
        if (sub.id === subId) {
          const specialties = sub.subjectSpecialties.includes(subject)
            ? sub.subjectSpecialties.filter(s => s !== subject)
            : [...sub.subjectSpecialties, subject];
          return { ...sub, subjectSpecialties: specialties };
        }
        return sub;
      })
    }));
  };

  const updateAvailability = (subId: string, day: string, available: boolean) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.map(sub => 
        sub.id === subId 
          ? { ...sub, availability: { ...sub.availability, [day]: available } }
          : sub
      )
    }));
  };

  const setRating = (subId: string, rating: number) => {
    updateSubstitute(subId, 'rating', rating);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Substitute Pool Setup</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure your substitute teachers and their qualifications
        </p>
      </div>

      {/* Add Substitute Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-900">
          Substitute Teachers ({formData.substitutes.length})
        </h4>
        <button
          onClick={addSubstitute}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Substitute
        </button>
      </div>

      {/* Substitutes List */}
      {formData.substitutes.length > 0 ? (
        <div className="space-y-6">
          {formData.substitutes.map((substitute, index) => (
            <div key={substitute.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-medium text-gray-900">
                  Substitute #{index + 1}
                </h5>
                <button
                  onClick={() => removeSubstitute(substitute.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={substitute.name}
                      onChange={(e) => updateSubstitute(substitute.id, 'name', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={substitute.email}
                      onChange={(e) => updateSubstitute(substitute.id, 'email', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="john.smith@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={substitute.phone}
                      onChange={(e) => updateSubstitute(substitute.id, 'phone', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Certification Level
                    </label>
                    <select
                      value={substitute.certificationLevel}
                      onChange={(e) => updateSubstitute(substitute.id, 'certificationLevel', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {certificationLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Periods Per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={substitute.maxPeriodsPerDay}
                      onChange={(e) => updateSubstitute(substitute.id, 'maxPeriodsPerDay', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Subject Specialties and Availability */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Subject Specialties
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.map(subject => (
                        <label key={subject} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={substitute.subjectSpecialties.includes(subject)}
                            onChange={() => toggleSubjectSpecialty(substitute.id, subject)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Weekly Availability
                    </label>
                    <div className="space-y-2">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={substitute.availability[day as keyof typeof substitute.availability]}
                            onChange={(e) => updateAvailability(substitute.id, day, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Performance Rating
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(substitute.id, star)}
                          className="text-yellow-400 hover:text-yellow-500"
                        >
                          {star <= substitute.rating ? (
                            <StarIconSolid className="h-5 w-5" />
                          ) : (
                            <StarIcon className="h-5 w-5" />
                          )}
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        ({substitute.rating}/5)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Notes / Special Instructions
                </label>
                <textarea
                  value={substitute.notes}
                  onChange={(e) => updateSubstitute(substitute.id, 'notes', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Any special notes about this substitute..."
                />
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Specialties:</span> {
                    substitute.subjectSpecialties.length > 0 
                      ? substitute.subjectSpecialties.join(', ')
                      : 'None selected'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Available:</span> {
                    Object.entries(substitute.availability)
                      .filter(([day, available]) => available)
                      .map(([day]) => day)
                      .join(', ') || 'No days selected'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No substitutes added yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add substitute teachers to your pool to enable automated coverage assignments.
          </p>
          <div className="mt-6">
            <button
              onClick={addSubstitute}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Substitute
            </button>
          </div>
        </div>
      )}

      {/* Pool Summary */}
      {formData.substitutes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Substitute Pool Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p><span className="font-medium">Total substitutes:</span> {formData.substitutes.length}</p>
              <p><span className="font-medium">Average rating:</span> {
                formData.substitutes.length > 0 
                  ? (formData.substitutes.reduce((sum, sub) => sum + sub.rating, 0) / formData.substitutes.length).toFixed(1)
                  : '0'
              }/5</p>
            </div>
            <div>
              <p><span className="font-medium">Most common specialty:</span> {
                (() => {
                  const specialtyCounts: { [key: string]: number } = {};
                  formData.substitutes.forEach(sub => {
                    sub.subjectSpecialties.forEach(specialty => {
                      specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
                    });
                  });
                  const topSpecialty = Object.entries(specialtyCounts).sort((a, b) => b[1] - a[1])[0];
                  return topSpecialty ? `${topSpecialty[0]} (${topSpecialty[1]})` : 'None';
                })()
              }</p>
              <p><span className="font-medium">Certified teachers:</span> {
                formData.substitutes.filter(sub => 
                  sub.certificationLevel === 'standard' || sub.certificationLevel === 'professional'
                ).length
              }</p>
            </div>
            <div>
              <p><span className="font-medium">Full-time available:</span> {
                formData.substitutes.filter(sub => 
                  Object.values(sub.availability).every(day => day)
                ).length
              }</p>
              <p><span className="font-medium">High capacity (6+ periods):</span> {
                formData.substitutes.filter(sub => sub.maxPeriodsPerDay >= 6).length
              }</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 