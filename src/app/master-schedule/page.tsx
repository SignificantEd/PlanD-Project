"use client";
import { useState, useEffect } from "react";
import MetricsTicker from "../../components/MetricsTicker";
import { sortByLastName } from "../../lib/sortByLastName";

interface MasterScheduleEntry {
  id: string;
  teacherId: string;
  teacher: {
    name: string;
    department: string;
    role: string;
  };
  schoolId: string;
  period: string;
  subject: string;
  room: string;
  dayOfWeek: string | null;
  isTeaching: boolean;
  [key: string]: any; // allow dynamic property access
}

interface Teacher {
  id: string;
  name: string;
  department: string;
  role: string;
  email?: string;
  [key: string]: any; // allow dynamic property access
}

const PERIODS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const NON_TEACHING_TYPES = ["Lunch", "PD", "PLC", "Prep", "Free"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const DEPARTMENT_COLORS: Record<string, string> = {
  Math: 'bg-green-100 text-green-800',
  English: 'bg-blue-100 text-blue-800',
  Science: 'bg-yellow-100 text-yellow-800',
  History: 'bg-red-100 text-red-800',
  PE: 'bg-purple-100 text-purple-800',
  Art: 'bg-pink-100 text-pink-800',
  Music: 'bg-indigo-100 text-indigo-800',
  Other: 'bg-gray-100 text-gray-800',
};

function abbreviateSubject(subject: string): string {
  if (!subject) return '';
  if (subject === 'Free Period' || subject === 'Free') return 'Free';
  
  const map: Record<string, string> = {
    // Mathematics
    'Calculus': 'Calc',
    'Algebra I': 'Alg1',
    'Algebra II': 'Alg2', 
    'Geometry': 'Geom',
    'Statistics': 'Stat',
    'Precalculus': 'PreCalc',
    
    // Science
    'Biology': 'Bio',
    'Chemistry': 'Chem',
    'Physics': 'Phys',
    'Environmental Science': 'EnvSci',
    'Earth Science': 'Earth',
    
    // English
    'English 9': 'Eng9',
    'English 10': 'Eng10',
    'English 11': 'Eng11',
    'English 12': 'Eng12',
    'AP English': 'APEng',
    'Literature': 'Lit',
    'Writing': 'Write',
    
    // History
    'World History': 'WHist',
    'US History': 'USH',
    'Government': 'Govt',
    'Economics': 'Econ',
    'AP US History': 'APUSH',
    'AP World History': 'APWH',
    
    // Foreign Languages
    'Spanish I': 'SpaI',
    'Spanish II': 'SpaII',
    'French I': 'FreI',
    'French II': 'FreII',
    'German I': 'GerI',
    'German II': 'GerII',
    'Latin I': 'LatI',
    'Latin II': 'LatII',
    
    // Physical Education
    'Physical Education': 'PE',
    'Health': 'Health',
    'Weight Training': 'Weight',
    'Fitness': 'Fitness',
    'Sports': 'Sports',
    
    // Arts
    'Art I': 'ArtI',
    'Art II': 'ArtII',
    'Visual Art': 'VisArt',
    'Drawing': 'Draw',
    'Painting': 'Paint',
    'Sculpture': 'Sculpt',
    'Photography': 'Photo',
    'Photo': 'Photo',
    
    // Music
    'Band': 'Band',
    'Choir': 'Choir',
    'Orchestra': 'Orch',
    'Music Theory': 'MusicTh',
    'Jazz Band': 'Jazz',
    'AP Music': 'APMusic',
    
    // Paraprofessional support classes
    'Algebra Support': 'AlgSup',
    'Geometry Support': 'GeomSup',
    'Math Lab': 'MathLab',
    'Math Resource': 'MathRes',
    'Biology Support': 'BioSup',
    'Chemistry Support': 'ChemSup',
    'Science Lab Support': 'SciLab',
    'English Support': 'EngSup',
    'Reading Support': 'ReadSup',
    'Writing Lab': 'WriteLab',
    'Literature Support': 'LitSup',
    'History Support': 'HistSup',
    'Social Studies Support': 'SocSup',
    'Resource Room': 'ResRoom',
    'Study Hall': 'Study',
    'Supervision': 'Super',
    'Special Education Support': 'SpEd',
    'Learning Support': 'LearnSup',
    'Academic Support': 'AcadSup',
    'Tutoring': 'Tutor',
    'Small Group Support': 'SGroup',
    
    // General
    'Free': 'Free',
    'Free Period': 'Free'
  };
  
  if (map[subject]) return map[subject];
  
  // Fallback: take first 4 characters
  return subject.substring(0, 4);
}

// Utility: Extract last name for sorting
function getLastName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

// Utility: Get salutation based on name (only Mr., Ms., Mrs., Dr.)
function getSalutation(t: any): string {
  if (t.salutation) return t.salutation;
  
  const name = t.name || '';
  
  // Check for Dr. first
  if (name.toLowerCase().includes('dr.')) return 'Dr.';
  
  // Check for Professor (convert to Dr.)
  if (name.toLowerCase().includes('professor')) return 'Dr.';
  
  // Check for other titles and convert to standard salutations
  if (name.toLowerCase().includes('señora') || name.toLowerCase().includes('madame')) return 'Mrs.';
  if (name.toLowerCase().includes('señor') || name.toLowerCase().includes('monsieur') || 
      name.toLowerCase().includes('herr') || name.toLowerCase().includes('signor') || 
      name.toLowerCase().includes('senhor')) return 'Mr.';
  if (name.toLowerCase().includes('señorita') || name.toLowerCase().includes('mademoiselle') || 
      name.toLowerCase().includes('frau') || name.toLowerCase().includes('signora') || 
      name.toLowerCase().includes('maestra')) return 'Ms.';
  if (name.toLowerCase().includes('maestro')) return 'Mr.';
  
  // Default based on common patterns
  if (name.toLowerCase().includes('coach')) return 'Mr.';
  
  // Default to Ms. for most cases
  return 'Ms.';
}

// Utility: Format teacher display name with first initial
function getDisplayName(t: any): string {
  const names = t.name.trim().split(' ');
  const firstInitial = names[0] ? names[0][0].toUpperCase() + '.' : '';
  const lastName = names.length > 1 ? names[names.length - 1] : names[0];
  return `${firstInitial} ${lastName}`;
}

export default function MasterSchedulePage() {
  const [masterSchedule, setMasterSchedule] = useState<MasterScheduleEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [filter, setFilter] = useState<{ [key: string]: string }>({});
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ [key: string]: any, periods?: Record<string, string>, email?: string }>({});
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', department: '', role: 'teacher' });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching master schedule data...');
      const [scheduleRes, teachersRes] = await Promise.all([
        fetch('/api/master-schedule'),
        fetch('/api/teachers')
      ]);
      
      console.log('Schedule response status:', scheduleRes.status);
      console.log('Teachers response status:', teachersRes.status);
      
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        console.log('Schedule data count:', scheduleData.length);
        setMasterSchedule(scheduleData);
      } else {
        console.error('Schedule response not ok:', scheduleRes.status);
      }
      
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        console.log('Teachers data count:', teachersData.length);
        setTeachers(teachersData);
      } else {
        console.error('Teachers response not ok:', teachersRes.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load master schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleEntry = (teacherId: string, period: string, day: string) => {
    return masterSchedule.find(entry => 
      entry.teacherId === teacherId && 
      entry.period === period && 
      (entry.dayOfWeek === day || entry.dayOfWeek === null)
    );
  };

  const getFilteredTeachers = () => {
    console.log('Getting filtered teachers, total teachers:', teachers.length);
    if (selectedTeacher === 'all') {
      const filtered = teachers.filter(teacher => teacher.role === 'teacher' || teacher.role === 'paraprofessional');
      console.log('Filtered teachers count:', filtered.length);
      return filtered;
    }
    const filtered = teachers.filter(teacher => teacher.id === selectedTeacher);
    console.log('Single teacher filtered:', filtered.length);
    return filtered;
  };

  const getFreePeriods = (teacherId: string, day: string) => {
    return PERIODS.filter(period => {
      const entry = getScheduleEntry(teacherId, period, day);
      return !entry || !entry.isTeaching;
    });
  };

  const getTeachingPeriods = (teacherId: string, day: string) => {
    return PERIODS.filter(period => {
      const entry = getScheduleEntry(teacherId, period, day);
      return entry && entry.isTeaching;
    });
  };

  const getNonTeachingPeriods = (teacherId: string) => {
    return PERIODS.filter(period => {
      const entry = getScheduleEntry(teacherId, period, selectedDay);
      return !entry || !entry.isTeaching;
    });
  };

  const getLoad = (teacherId: string) => getTeachingPeriods(teacherId, selectedDay).length;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortedTeachers = () => {
    let filtered = getFilteredTeachers();
    const { key, direction } = sortConfig;
    if (key === 'name') {
      filtered = [...filtered].sort((a, b) => {
        const aLast = getLastName(a.name).toLowerCase();
        const bLast = getLastName(b.name).toLowerCase();
        if (aLast < bLast) return direction === 'asc' ? -1 : 1;
        if (aLast > bLast) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (key === 'department' || key === 'role') {
      filtered = [...filtered].sort((a, b) => {
        const aVal = (a as any)[key] || '';
        const bVal = (b as any)[key] || '';
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (PERIODS.includes(key)) {
      filtered = [...filtered].sort((a, b) => {
        const aEntry = getScheduleEntry(a.id, key, selectedDay);
        const bEntry = getScheduleEntry(b.id, key, selectedDay);
        const aVal = aEntry ? (aEntry.isTeaching ? aEntry.subject : 'FREE') : '';
        const bVal = bEntry ? (bEntry.isTeaching ? bEntry.subject : 'FREE') : '';
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (key === 'freePeriods') {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getFreePeriods(a.id, selectedDay).length;
        const bVal = getFreePeriods(b.id, selectedDay).length;
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  };

  const startEdit = (teacherId: string) => {
    setEditRow(teacherId);
    const periods: Record<string, string> = {};
    PERIODS.forEach(p => {
      const entry = getScheduleEntry(teacherId, p, selectedDay);
      periods[p] = entry ? (entry.isTeaching ? `${entry.subject} (${entry.room})` : (entry.subject || entry.type || '')) : '';
    });
    const teacher = teachers.find(t => t.id === teacherId);
    setEditData({ ...teacher, periods, email: teacher?.email });
  };

  const cancelEdit = () => {
    setEditRow(null);
    setEditData({});
  };

  const saveEdit = async (teacherId: string) => {
    // Save all period edits for this teacher
    if (editData && editData.periods) {
      for (const period of Object.keys(editData.periods)) {
        let value = editData.periods[period] || '';
        let subject = value;
        let room = 'N/A';
        // If value contains parentheses, parse subject and room
        const match = value.match(/^(.*)\((.*)\)$/);
        if (match) {
          subject = match[1].trim();
          room = match[2].trim();
        }
        await fetch('/api/master-schedule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId,
            period,
            subject,
            room,
          }),
        });
      }
    }
    // Save teacher email if changed
    if (editData.email) {
      await fetch('/api/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacherId, email: editData.email }),
      });
    }
    setEditRow(null);
    setEditData({});
    fetchData();
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePeriodEdit = (period: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, periods: { ...prev.periods, [period]: value } }));
  };

  const handleAdd = () => {
    // TODO: API call to add new teacher/schedule
    fetchData();
  };

  const handleDelete = (teacherId: string) => {
    // TODO: API call to delete teacher/schedule
    fetchData();
  };

  const handleAddTeacher = async () => {
    setAddLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });
      if (res.ok) {
        setShowAddTeacher(false);
        setNewTeacher({ name: '', department: '', role: 'teacher' });
        fetchData();
        setSuccess('Teacher added!');
      } else {
        setError('Failed to add teacher');
      }
    } catch (e) {
      setError('Failed to add teacher');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex flex-col items-center py-8 px-4">
        <div className="flex flex-col items-center mb-8">
          <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2" />
          <h1 className="text-3xl font-bold text-indigo-800">PlanD Master Schedule</h1>
          <p className="text-indigo-600 font-medium">Chaos is not Scheduled</p>
          <span className="text-xs text-gray-500 mt-1">A Significant Consulting Product</span>
        </div>
        
        <nav className="mb-8 flex space-x-6">
          <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
          <a href="/substitutes" className="text-indigo-700 font-semibold hover:underline">Substitutes</a>
          <a href="/master-schedule" className="text-indigo-700 font-semibold underline">Master Schedule</a>
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>

        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800">Master Schedule Viewer</h2>
            <div className="flex space-x-4">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All Teachers</option>
                {sortByLastName(teachers.filter(teacher => teacher.role === 'teacher' || teacher.role === 'paraprofessional'))
                  .map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Total Teachers</h3>
              <p className="text-2xl font-bold text-blue-600 text-center">
                {teachers.filter(t => t.role === 'teacher').length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Paraprofessionals</h3>
              <p className="text-2xl font-bold text-green-600 text-center">
                {teachers.filter(t => t.role === 'paraprofessional').length}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800">Free Periods</h3>
              <p className="text-2xl font-bold text-yellow-600 text-center">
                {getFilteredTeachers().reduce((total, teacher) => 
                  total + getFreePeriods(teacher.id, selectedDay).length, 0
                )}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800">Teaching Periods</h3>
              <p className="text-2xl font-bold text-purple-600 text-center">
                {getFilteredTeachers().reduce((total, teacher) => 
                  total + getTeachingPeriods(teacher.id, selectedDay).length, 0
                )}
              </p>
            </div>
          </div>

          {/* Master Schedule Table */}
          <div className="flex justify-end mb-4">
            <button
              className="bg-indigo-700 text-white font-semibold px-4 py-2 rounded hover:bg-indigo-800 text-xs"
              onClick={() => setShowAddTeacher(v => !v)}
            >
              {showAddTeacher ? 'Cancel' : 'Add Teacher'}
            </button>
          </div>
          {showAddTeacher && (
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-4 flex flex-col gap-2 max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  className="border px-2 py-1 rounded text-xs flex-1"
                  placeholder="Name"
                  value={newTeacher.name}
                  onChange={e => setNewTeacher(nt => ({ ...nt, name: e.target.value }))}
                />
                <input
                  className="border px-2 py-1 rounded text-xs flex-1"
                  placeholder="Department"
                  value={newTeacher.department}
                  onChange={e => setNewTeacher(nt => ({ ...nt, department: e.target.value }))}
                />
                <select
                  className="border px-2 py-1 rounded text-xs"
                  value={newTeacher.role}
                  onChange={e => setNewTeacher(nt => ({ ...nt, role: e.target.value }))}
                >
                  <option value="teacher">Teacher</option>
                  <option value="paraprofessional">Paraprofessional</option>
                </select>
              </div>
              <button
                className="bg-green-600 text-white rounded px-3 py-1 text-xs font-semibold mt-2 disabled:opacity-50"
                onClick={handleAddTeacher}
                disabled={addLoading || !newTeacher.name || !newTeacher.department}
              >
                {addLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
          <div className="overflow-x-auto w-full max-w-full">
            <table className="min-w-max bg-white rounded shadow w-full max-w-full">
              <thead>
                <tr className="bg-gray-100 text-xs">
                  <th className="px-0.5 py-0.5 w-10 text-center cursor-pointer" onClick={() => handleSort('name')}>Tchr</th>
                  <th className="px-0.5 py-0.5 w-10 text-center cursor-pointer" onClick={() => handleSort('department')}>Dept</th>
                  <th className="px-0.5 py-0.5 w-10 text-center cursor-pointer" onClick={() => handleSort('role')}>Role</th>
                  <th className="px-0.5 py-0.5 w-6 text-center cursor-pointer" onClick={() => handleSort('load')}>Load</th>
                  {PERIODS.map((p, i) => (
                    <th key={p} className="px-1 py-0.5 w-14 text-xs text-center cursor-pointer" onClick={() => handleSort(p)}>{`P${i+1}`}</th>
                  ))}
                  <th className="px-0.5 py-0.5 w-10 text-center cursor-pointer" title="Free Periods (list)" onClick={() => handleSort('freePeriods')}>Free</th>
                  <th className="px-0.5 py-0.5 w-12 text-center cursor-pointer" onClick={() => handleSort('actions')}>Act</th>
                </tr>
              </thead>
              <tbody>
                {getSortedTeachers().map(t => (
                  <tr key={t.id} className={editRow === t.id ? 'bg-yellow-50' : ''}>
                    <td className="px-0.5 py-0.5 text-xs font-medium">
                      {editRow === t.id ? (
                        <>
                          <input value={editData.name} onChange={e => handleEditChange('name', e.target.value)} className="w-24 text-xs px-1 py-1" />
                          <input value={editData.email || ''} onChange={e => handleEditChange('email', e.target.value)} className="w-32 text-xs px-1 py-1 ml-2" placeholder="Email" />
                        </>
                      ) : (
                        <span>{getDisplayName(t)}</span>
                      )}
                    </td>
                    <td className="px-0.5 py-0.5 text-xs">{editRow === t.id ? <input value={editData.department} onChange={e => handleEditChange('department', e.target.value)} className="w-16 text-xs px-1 py-1" /> : <span className="text-xs">{(t.department || '').slice(0,3).toUpperCase()}</span>}</td>
                    <td className="px-0.5 py-0.5 text-xs">{editRow === t.id ? <input value={editData.role} onChange={e => handleEditChange('role', e.target.value)} className="w-10 text-xs px-1 py-1" /> : <span className="text-xs">{(t.role || '').slice(0,3).toUpperCase()}</span>}</td>
                    <td className="px-0.5 py-0.5 text-xs w-6 text-center">{getLoad(t.id)}</td>
                    {PERIODS.map((p, i) => (
                      <td key={p} className="px-1 py-0 w-14 text-xs text-gray-700 whitespace-nowrap text-center overflow-hidden text-ellipsis" style={{maxWidth: '3.5rem'}}>
                        {editRow === t.id ? (
                          <input
                            value={editData.periods?.[p] || ''}
                            onChange={e => handlePeriodEdit(p, e.target.value)}
                            placeholder="Subject/Room or Type"
                            className="w-16 text-xs px-1 py-1"
                          />
                        ) : (
                          (() => {
                            const entry = getScheduleEntry(t.id, p, selectedDay);
                            if (!entry || (!entry.isTeaching && !entry.subject && !entry.type)) return <span className="bg-blue-200 text-blue-800 rounded px-1 py-0 text-xs font-semibold">Free</span>;
                            if (entry.isTeaching) {
                              const abbr = abbreviateSubject(entry.subject);
                              const dept = t.department || 'Other';
                              const colorClass = DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS['Other'];
                              return <span className={`rounded px-1 py-0 text-xs font-semibold ${colorClass}`} title={entry.subject}>{abbr}</span>;
                            }
                            return <span title={entry.subject || entry.type}>{abbreviateSubject(entry.subject || entry.type)}</span>;
                          })()
                          )}
                        </td>
                    ))}
                    {/* Free periods column, show at most 4, ellipsis and tooltip for more */}
                    <td className="px-0.5 py-0.5 w-10 text-xs text-center overflow-hidden text-ellipsis" style={{maxWidth: '2.5rem'}}>{
                      (() => {
                        const freePeriods = getFreePeriods(t.id, selectedDay).map(p => `P${PERIODS.indexOf(p) + 1}`);
                        const display = freePeriods.slice(0, 4).join(', ');
                        const tooltip = freePeriods.length > 4 ? freePeriods.join(', ') : '';
                        return <span title={tooltip}>{display}{freePeriods.length > 4 ? ', ...' : ''}</span>;
                      })()
                    }</td>
                    {/* Act column as dropdown */}
                    <td className="px-0.5 py-0.5 w-12 text-xs text-center">
                      <div className="relative inline-block text-left">
                        <select className="text-xs border rounded px-1 py-0.5" onChange={e => {
                          if (e.target.value === 'edit') startEdit(t.id);
                          if (e.target.value === 'delete') handleDelete(t.id);
                          e.target.value = '';
                        }} defaultValue="">
                          <option value="" disabled>Action</option>
                          <option value="edit">Edit</option>
                          <option value="delete">Delete</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {success && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-600 flex gap-4">
        <span><span className="bg-blue-200 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">Free</span> = Free Period</span>
      </div>
    </div>
  );
} 