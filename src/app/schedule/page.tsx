"use client"

import { useState, useEffect } from 'react';
import { ITeacher, ICSVTeacherRow } from '../../types/interfaces';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function SchedulePage() {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  // Navigation items for the enterprise system
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar', current: true },
    { name: 'Absent Staff', href: '/absences', icon: 'user-group' },
    { name: 'Substitute Pool', href: '/substitutes', icon: 'academic-cap' },
    { name: 'Settings', href: '/settings', icon: 'cog' },
    { name: 'Coverage Results', href: '/coverage-results', icon: 'check-circle' },
    { name: 'Approval Queue', href: '/approval-queue', icon: 'document-text' },
    { name: 'Reports', href: '/reports', icon: 'chart-bar' },
    { name: 'History', href: '/history', icon: 'clock' }
  ];

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      setImportProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/import-schedule', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Schedule imported successfully! ${result.imported} teachers imported.`);
        setSelectedFile(null);
        fetchScheduleData(); // Refresh the data
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error importing schedule:', error);
      alert('Error importing schedule. Please try again.');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export-schedule');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting schedule:', error);
      alert('Error exporting schedule. Please try again.');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'home': CalendarIcon,
      'calendar': CalendarIcon,
      'user-group': UserGroupIcon,
      'academic-cap': AcademicCapIcon,
      'cog': CogIcon,
      'check-circle': CheckCircleIcon,
      'document-text': DocumentTextIcon,
      'chart-bar': ChartBarIcon,
      'clock': ClockIcon
    };
    return iconMap[iconName] || CalendarIcon;
  };

  const getDayType = (date: Date): 'A' | 'B' => {
    const dayOfWeek = date.getDay();
    return dayOfWeek % 2 === 0 ? 'A' : 'B';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/significant-logo.png" 
                  alt="Significant Consulting Logo" 
                  className="h-12 w-12"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">PlanD Enterprise</h1>
                <p className="text-sm text-gray-600">Master Schedule Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Day {getDayType(new Date())}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = getIconComponent(item.icon || 'home');
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Master Schedule</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CSV File Format
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p>Expected columns: Teacher_Name, Department, Room, Email, Phone, isPara, 1A, 1B, 2A, 2B, ..., 9A, 9B, Prep_Periods, PLC_Periods, PD_Periods</p>
                      <p className="mt-2">Prep_Periods, PLC_Periods, PD_Periods should be comma-separated period numbers (e.g., "2,5")</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                          Import
                        </div>
                      )}
                    </button>
                  </div>

                  {importing && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-indigo-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : teachers.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Schedule Entries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : teachers.reduce((acc, teacher) => acc + Object.keys(teacher.schedule).length, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : new Set(teachers.map(t => t.department)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Teacher Schedules</h3>
              </div>
              
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : teachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teachers.slice(0, 10).map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-indigo-600">
                                    {teacher.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                                {teacher.isPara && (
                                  <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full inline-block">
                                    Para
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {teacher.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(teacher.schedule).slice(0, 4).map(([period, subject]) => (
                                <span key={period} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {period}: {subject}
                                </span>
                              ))}
                              {Object.keys(teacher.schedule).length > 4 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{Object.keys(teacher.schedule).length - 4} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Import a CSV file to get started with the master schedule.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 