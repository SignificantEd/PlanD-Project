"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreferredTeacherDropdown from '../../../components/PreferredTeacherDropdown';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Substitute {
  id: string;
  name: string;
  email: string;
  cell?: string;
  subjectSpecialties: string[];
  availability: Record<string, string[]>;
  preferredTeacherId?: string;
  preferredTeacherName?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  cell: string;
  subjectSpecialties: string[];
  availability: Record<string, string[]>;
  preferredTeacherId: string | null;
}

export default function SubstituteManagePage() {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubstitute, setEditingSubstitute] = useState<Substitute | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cell: '',
    subjectSpecialties: [],
    availability: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    },
    preferredTeacherId: null
  });

  const subjectOptions = [
    'Math', 'Science', 'English', 'History', 'Foreign Languages',
    'Physical Education', 'Arts', 'Music', 'Special Education', 'General'
  ];

  const periodOptions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchSubstitutes();
  }, []);

  const fetchSubstitutes = async () => {
    try {
      const response = await fetch('/api/substitutes/all');
      if (response.ok) {
        const data = await response.json();
        // Enrich with preferred teacher names
        const enrichedData = await Promise.all(
          data.map(async (sub: Substitute) => {
            if (sub.preferredTeacherId) {
              try {
                const teacherResponse = await fetch(`/api/teachers/${sub.preferredTeacherId}`);
                if (teacherResponse.ok) {
                  const teacher = await teacherResponse.json();
                  return { ...sub, preferredTeacherName: teacher.name };
                }
              } catch (e) {
                console.error('Error fetching teacher name:', e);
              }
            }
            return sub;
          })
        );
        setSubstitutes(enrichedData);
      } else {
        setError('Failed to fetch substitutes');
      }
    } catch (error) {
      console.error('Error fetching substitutes:', error);
      setError('Error loading substitutes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cell: '',
      subjectSpecialties: [],
      availability: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: []
      },
      preferredTeacherId: null
    });
    setEditingSubstitute(null);
    setError('');
    setSuccess('');
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (substitute: Substitute) => {
    setFormData({
      name: substitute.name,
      email: substitute.email,
      cell: substitute.cell || '',
      subjectSpecialties: substitute.subjectSpecialties,
      availability: substitute.availability,
      preferredTeacherId: substitute.preferredTeacherId || null
    });
    setEditingSubstitute(substitute);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = editingSubstitute ? '/api/substitutes/manage' : '/api/substitutes/manage';
      const method = editingSubstitute ? 'PUT' : 'POST';
      const payload = editingSubstitute 
        ? { ...formData, id: editingSubstitute.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(editingSubstitute ? 'Substitute updated successfully!' : 'Substitute added successfully!');
        setShowModal(false);
        resetForm();
        fetchSubstitutes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save substitute');
      }
    } catch (error) {
      console.error('Error saving substitute:', error);
      setError('Error saving substitute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this substitute?')) return;

    try {
      const response = await fetch(`/api/substitutes/manage?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Substitute deleted successfully!');
        fetchSubstitutes();
      } else {
        setError('Failed to delete substitute');
      }
    } catch (error) {
      console.error('Error deleting substitute:', error);
      setError('Error deleting substitute');
    }
  };

  const handleAvailabilityChange = (day: string, periods: string[]) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: periods
      }
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjectSpecialties: checked
        ? [...prev.subjectSpecialties, subject]
        : prev.subjectSpecialties.filter(s => s !== subject)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading substitutes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Substitute Management</h1>
            <p className="text-gray-600 mt-2">Add, edit, and manage substitute teachers with preferred assignments</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Substitute
          </button>
        </div>

        {/* Navigation */}
        <nav className="mb-6 flex space-x-6 border-b pb-4">
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
          <a href="/substitutes/manage" className="text-indigo-700 font-semibold underline">Manage Substitutes</a>
          <a href="/master-schedule" className="text-indigo-700 font-semibold hover:underline">Master Schedule</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <XCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Substitutes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {substitutes.map((substitute) => (
            <div key={substitute.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{substitute.name}</h3>
                    <p className="text-sm text-gray-600">{substitute.email}</p>
                    {substitute.cell && (
                      <p className="text-sm text-gray-600">{substitute.cell}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(substitute)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(substitute.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Preferred Teacher */}
              {substitute.preferredTeacherName && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Preferred for: {substitute.preferredTeacherName}
                    </span>
                  </div>
                </div>
              )}

              {/* Subject Specialties */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  Specialties
                </h4>
                <div className="flex flex-wrap gap-2">
                  {substitute.subjectSpecialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Availability
                </h4>
                <div className="space-y-1">
                  {dayOptions.map((day) => {
                    const periods = substitute.availability[day] || [];
                    return (
                      <div key={day} className="flex justify-between text-xs">
                        <span className="text-gray-600">{day}:</span>
                        <span className="text-gray-800">
                          {periods.length > 0 ? periods.join(', ') : 'Not Available'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {substitutes.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No substitutes found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first substitute teacher.</p>
            <button
              onClick={handleAdd}
              className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Substitute
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingSubstitute ? 'Edit Substitute' : 'Add Substitute'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cell Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.cell}
                        onChange={(e) => setFormData(prev => ({ ...prev, cell: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <PreferredTeacherDropdown
                        selectedTeacherId={formData.preferredTeacherId || undefined}
                        onTeacherSelect={(teacherId) => setFormData(prev => ({ ...prev, preferredTeacherId: teacherId }))}
                      />
                    </div>
                  </div>

                  {/* Subject Specialties */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Specialties *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subjectOptions.map((subject) => (
                        <label key={subject} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.subjectSpecialties.includes(subject)}
                            onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability *
                    </label>
                    <div className="space-y-4">
                      {dayOptions.map((day) => (
                        <div key={day} className="border rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{day}</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {periodOptions.map((period) => (
                              <label key={period} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.availability[day].includes(period)}
                                  onChange={(e) => {
                                    const periods = e.target.checked
                                      ? [...formData.availability[day], period]
                                      : formData.availability[day].filter(p => p !== period);
                                    handleAvailabilityChange(day, periods);
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700">{period}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : (editingSubstitute ? 'Update' : 'Add')} Substitute
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 