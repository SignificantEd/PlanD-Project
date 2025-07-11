'use client';

import { useState, useEffect } from 'react';

interface Teacher {
  id: string;
  name: string;
  department: string;
  role: string;
}

interface MasterSchedule {
  id: string;
  teacherId: string;
  period: string;
  subject: string;
  room: string;
  isTeaching: boolean;
  teacher: Teacher;
}

interface Substitute {
  id: string;
  name: string;
  email: string;
  subjectSpecialties: string[];
  availability: Record<string, string[]>;
}

export default function DataViewPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [masterSchedule, setMasterSchedule] = useState<MasterSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subsRes, scheduleRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/substitutes'),
        fetch('/api/master-schedule')
      ]);

      const teachersData = await teachersRes.json();
      const subsData = await subsRes.json();
      const scheduleData = await scheduleRes.json();

      setTeachers(teachersData);
      setSubstitutes(subsData);
      setMasterSchedule(scheduleData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  const paraprofessionals = teachers.filter(t => t.role === 'paraprofessional');
  const regularTeachers = teachers.filter(t => t.role === 'teacher');
  const freePeriods = masterSchedule.filter(ms => !ms.isTeaching);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Algorithm Data Verification</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Substitutes</h3>
            <p className="text-3xl font-bold text-blue-600">{substitutes.length}</p>
            <p className="text-sm text-gray-600">Available for coverage</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
            <p className="text-3xl font-bold text-green-600">{regularTeachers.length}</p>
            <p className="text-sm text-gray-600">Internal staff</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paraprofessionals</h3>
            <p className="text-3xl font-bold text-purple-600">{paraprofessionals.length}</p>
            <p className="text-sm text-gray-600">Support staff</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Periods</h3>
            <p className="text-3xl font-bold text-orange-600">{freePeriods.length}</p>
            <p className="text-sm text-gray-600">Available for coverage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Substitutes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Substitute Pool</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {substitutes.map(sub => (
                <div key={sub.id} className="border rounded p-4">
                  <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                  <p className="text-sm text-gray-600">{sub.email}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Specialties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sub.subjectSpecialties.map((specialty, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Monday Availability:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sub.availability.Monday?.map((period, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {period}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teachers by Department */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Teachers by Department</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(
                regularTeachers.reduce((acc, teacher) => {
                  if (!acc[teacher.department]) acc[teacher.department] = [];
                  acc[teacher.department].push(teacher);
                  return acc;
                }, {} as Record<string, Teacher[]>)
              ).map(([dept, deptTeachers]) => (
                <div key={dept} className="border rounded p-4">
                  <h3 className="font-semibold text-gray-900">{dept}</h3>
                  <p className="text-sm text-gray-600">{deptTeachers.length} teachers</p>
                  <div className="mt-2">
                    {deptTeachers.slice(0, 3).map(teacher => (
                      <div key={teacher.id} className="text-sm text-gray-700">
                        {teacher.name}
                      </div>
                    ))}
                    {deptTeachers.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{deptTeachers.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Algorithm Status */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Algorithm Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span className="text-sm">Substitutes available: {substitutes.length > 0 ? '✅' : '❌'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span className="text-sm">Teachers available: {regularTeachers.length > 0 ? '✅' : '❌'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full mr-3"></span>
              <span className="text-sm">Paraprofessionals available: {paraprofessionals.length > 0 ? '✅' : '❌'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span className="text-sm">Free periods available: {freePeriods.length > 0 ? '✅' : '❌'}</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Issue Found</h3>
            <p className="text-sm text-yellow-700">
              No paraprofessionals found in database. The seed script needs to be updated to create paraprofessionals with role='paraprofessional'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 