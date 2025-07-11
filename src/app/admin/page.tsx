"use client";
import { useState, useEffect } from "react";

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

interface DatabaseStats {
  teachers: number;
  substitutes: number;
  paraprofessionals: number;
  masterScheduleEntries: number;
  freePeriods: number;
  absences: number;
  coverageAssignments: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [masterSchedule, setMasterSchedule] = useState<MasterSchedule[]>([]);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch database stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch master schedule
      const scheduleRes = await fetch('/api/master-schedule');
      const scheduleData = await scheduleRes.json();
      setMasterSchedule(scheduleData);

      // Fetch substitutes
      const subsRes = await fetch('/api/substitutes');
      const subsData = await subsRes.json();
      setSubstitutes(subsData);

      // Fetch teachers
      const teachersRes = await fetch('/api/teachers');
      const teachersData = await teachersRes.json();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Algorithm Data Verification & Management</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', name: 'Database Overview', icon: '📊' },
              { id: 'master-schedule', name: 'Master Schedule', icon: '📅' },
              { id: 'substitutes', name: 'Substitute Pool', icon: '👨‍🏫' },
              { id: 'paraprofessionals', name: 'Paraprofessionals', icon: '👨‍💼' },
              { id: 'teachers', name: 'All Teachers', icon: '👨‍🏫' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && (
            <DatabaseOverview stats={stats} />
          )}
          
          {activeTab === 'master-schedule' && (
            <MasterScheduleView masterSchedule={masterSchedule} periods={periods} />
          )}
          
          {activeTab === 'substitutes' && (
            <SubstitutePoolView substitutes={substitutes} days={days} periods={periods} />
          )}
          
          {activeTab === 'paraprofessionals' && (
            <ParaprofessionalView teachers={teachers} masterSchedule={masterSchedule} periods={periods} />
          )}
          
          {activeTab === 'teachers' && (
            <TeachersView teachers={teachers} masterSchedule={masterSchedule} periods={periods} />
          )}
        </div>
      </div>
    </div>
  );
}

function DatabaseOverview({ stats }: { stats: DatabaseStats | null }) {
  if (!stats) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.teachers}</div>
          <div className="text-sm text-blue-800">Teachers</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.substitutes}</div>
          <div className="text-sm text-green-800">Substitutes</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.paraprofessionals}</div>
          <div className="text-sm text-purple-800">Paraprofessionals</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.freePeriods}</div>
          <div className="text-sm text-orange-800">Free Periods</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Master Schedule</h3>
          <p className="text-3xl font-bold text-gray-700">{stats.masterScheduleEntries}</p>
          <p className="text-sm text-gray-600">Total entries</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Absences</h3>
          <p className="text-3xl font-bold text-gray-700">{stats.absences}</p>
          <p className="text-sm text-gray-600">Current absences</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Coverage Assignments</h3>
          <p className="text-3xl font-bold text-gray-700">{stats.coverageAssignments}</p>
          <p className="text-sm text-gray-600">Active assignments</p>
        </div>
      </div>
    </div>
  );
}

function MasterScheduleView({ masterSchedule, periods }: { masterSchedule: MasterSchedule[], periods: string[] }) {
  // Group by teacher
  const teacherSchedules = masterSchedule.reduce((acc, entry) => {
    if (!acc[entry.teacherId]) {
      acc[entry.teacherId] = {
        teacher: entry.teacher,
        schedule: {} as Record<string, { subject: string; room: string; isTeaching: boolean }>
      };
    }
    acc[entry.teacherId].schedule[entry.period] = {
      subject: entry.subject,
      room: entry.room,
      isTeaching: entry.isTeaching
    };
    return acc;
  }, {} as Record<string, { teacher: Teacher; schedule: Record<string, { subject: string; room: string; isTeaching: boolean }> }>);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Master Schedule View</h2>
      
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
              {periods.map(period => (
                <th key={period} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.values(teacherSchedules).map(({ teacher, schedule }) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {teacher.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.department}
                </td>
                {periods.map(period => {
                  const periodData = schedule[period];
                  return (
                    <td key={period} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {periodData ? (
                        <div className={`p-2 rounded ${periodData.isTeaching ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          <div className="font-medium">{periodData.subject}</div>
                          <div className="text-xs">{periodData.room}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubstitutePoolView({ substitutes, days, periods }: { substitutes: Substitute[], days: string[], periods: string[] }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Substitute Pool</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {substitutes.map(sub => (
          <div key={sub.id} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                <p className="text-sm text-gray-600">{sub.email}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Specialties:</h4>
              <div className="flex flex-wrap gap-2">
                {sub.subjectSpecialties.map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Availability:</h4>
              <div className="space-y-2">
                {days.map(day => (
                  <div key={day} className="flex items-center">
                    <span className="w-20 text-sm font-medium text-gray-700">{day}:</span>
                    <div className="flex flex-wrap gap-1">
                      {sub.availability[day] ? (
                        sub.availability[day].map(period => (
                          <span key={period} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {period}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Not available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParaprofessionalView({ teachers, masterSchedule, periods }: { teachers: Teacher[], masterSchedule: MasterSchedule[], periods: string[] }) {
  const paraprofessionals = teachers.filter(t => t.role === 'paraprofessional');
  
  // Group by paraprofessional
  const paraSchedules = paraprofessionals.map(para => {
    const schedule = masterSchedule.filter(ms => ms.teacherId === para.id);
    const scheduleByPeriod = schedule.reduce((acc, entry) => {
      acc[entry.period] = {
        subject: entry.subject,
        room: entry.room,
        isTeaching: entry.isTeaching
      };
      return acc;
    }, {} as Record<string, { subject: string; room: string; isTeaching: boolean }>);
    
    return { para, schedule: scheduleByPeriod };
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Paraprofessional Availability</h2>
      
      {paraprofessionals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No paraprofessionals found in database</p>
          <p className="text-gray-400 text-sm mt-2">Check the seed script to ensure paraprofessionals are created with role=&apos;paraprofessional&apos;</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paraprofessional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                {periods.map(period => (
                  <th key={period} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paraSchedules.map(({ para, schedule }) => (
                <tr key={para.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {para.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {para.department}
                  </td>
                  {periods.map(period => {
                    const periodData = schedule[period];
                    return (
                      <td key={period} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {periodData ? (
                          <div className={`p-2 rounded ${periodData.isTeaching ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            <div className="font-medium">{periodData.subject}</div>
                            <div className="text-xs">{periodData.room}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TeachersView({ teachers, masterSchedule, periods }: { teachers: Teacher[], masterSchedule: MasterSchedule[], periods: string[] }) {
  const regularTeachers = teachers.filter(t => t.role === 'teacher');
  
  // Group by teacher
  const teacherSchedules = regularTeachers.map(teacher => {
    const schedule = masterSchedule.filter(ms => ms.teacherId === teacher.id);
    const scheduleByPeriod = schedule.reduce((acc, entry) => {
      acc[entry.period] = {
        subject: entry.subject,
        room: entry.room,
        isTeaching: entry.isTeaching
      };
      return acc;
    }, {} as Record<string, { subject: string; room: string; isTeaching: boolean }>);
    
    return { teacher, schedule: scheduleByPeriod };
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Teachers</h2>
      
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
              {periods.map(period => (
                <th key={period} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teacherSchedules.map(({ teacher, schedule }) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {teacher.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teacher.department}
                </td>
                {periods.map(period => {
                  const periodData = schedule[period];
                  return (
                    <td key={period} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {periodData ? (
                        <div className={`p-2 rounded ${periodData.isTeaching ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          <div className="font-medium">{periodData.subject}</div>
                          <div className="text-xs">{periodData.room}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 