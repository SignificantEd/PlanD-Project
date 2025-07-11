"use client";
import { useState, useEffect } from "react";
import MetricsTicker from "../../components/MetricsTicker";
const PERIODS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const NON_TEACHING_TYPES = ["Lunch", "PD", "PLC", "Prep", "Free"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEPARTMENT_COLORS = {
    Math: 'bg-green-100 text-green-800',
    English: 'bg-blue-100 text-blue-800',
    Science: 'bg-yellow-100 text-yellow-800',
    History: 'bg-red-100 text-red-800',
    PE: 'bg-purple-100 text-purple-800',
    Art: 'bg-pink-100 text-pink-800',
    Music: 'bg-indigo-100 text-indigo-800',
    Other: 'bg-gray-100 text-gray-800',
};
function abbreviateSubject(subject) {
    if (!subject)
        return '';
    const map = {
        'Physical Education': 'PE',
        'Mathematics': 'Math',
        'Mathematics I': 'Math1',
        'Mathematics II': 'Math2',
        'English Language Arts': 'ELA',
        'Language Arts': 'LangA',
        'Social Studies': 'SocSt',
        'Science': 'Sci',
        'Biology': 'Bio',
        'Chemistry': 'Chem',
        'Physics': 'Phys',
        'Earth Science': 'Earth',
        'Environmental Science': 'EnvSc',
        'History': 'Hist',
        'World History': 'WHist',
        'US History': 'USH',
        'Government': 'Govt',
        'Economics': 'Econ',
        'Advisory': 'Adv',
        'Homeroom': 'Home',
        'Lunch': 'Lunch',
        'Preparation': 'Prep',
        'Free': 'Free',
        'Art': 'Art',
        'Visual Art': 'VArt',
        'Music': 'Music',
        'Band': 'Band',
        'Choir': 'Choir',
        'Orchestra': 'Orch',
        'World Language': 'WLang',
        'Spanish': 'Span',
        'French': 'Frnch',
        'German': 'Ger',
        'Mandarin': 'Mand',
        'Latin': 'Latin',
        'Computer Science': 'CompS',
        'Technology': 'Tech',
        'Health': 'Hlth',
        'PD': 'PD',
        'PLC': 'PLC',
        'Study Hall': 'StdyH',
        'Resource': 'Resrc',
        'Intervention': 'Intvn',
        'Reading': 'Read',
        'Writing': 'Write',
        'Geometry': 'Geom',
        'Algebra': 'Alg',
        'Algebra I': 'Alg1',
        'Algebra II': 'Alg2',
        'Trigonometry': 'Trig',
        'Calculus': 'Calc',
        'Statistics': 'Stats',
        'AP English': 'APEng',
        'AP Biology': 'APBio',
        'AP Chemistry': 'APChm',
        'AP Physics': 'APPhy',
        'AP US History': 'APUSH',
        'AP World History': 'APWH',
        'AP Calculus': 'APCal',
        'AP Statistics': 'APSta',
        'AP Government': 'APGov',
        'AP Spanish': 'APSpn',
        'AP French': 'APFrn',
        'AP Computer Science': 'APCS',
        'AP Art': 'APArt',
        'AP Music': 'APMus',
        'Support': 'Supp',
    };
    if (map[subject])
        return map[subject];
    // If already short, return as is
    if (subject.length <= 5)
        return subject;
    // Take first 2 letters of first word, then first 2 of second, up to 5 chars
    const words = subject.split(/\s+/);
    let abbr = '';
    if (words.length === 1) {
        abbr = words[0].slice(0, 5);
    }
    else if (words.length === 2) {
        abbr = words[0].slice(0, 3) + words[1].slice(0, 2);
    }
    else {
        abbr = words.map(w => w[0]).join('').toUpperCase();
        if (abbr.length < 5)
            abbr += subject.replace(/\s+/g, '').slice(0, 5 - abbr.length);
        abbr = abbr.slice(0, 5);
    }
    return abbr;
}
export default function MasterSchedulePage() {
    const [masterSchedule, setMasterSchedule] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [filter, setFilter] = useState({});
    const [editRow, setEditRow] = useState(null);
    const [editData, setEditData] = useState({});
    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', department: '', role: 'teacher' });
    const [addLoading, setAddLoading] = useState(false);
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        setLoading(true);
        try {
            const [scheduleRes, teachersRes] = await Promise.all([
                fetch('/api/master-schedule'),
                fetch('/api/teachers')
            ]);
            if (scheduleRes.ok) {
                const scheduleData = await scheduleRes.json();
                setMasterSchedule(scheduleData);
            }
            if (teachersRes.ok) {
                const teachersData = await teachersRes.json();
                setTeachers(teachersData);
            }
        }
        catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load master schedule data');
        }
        finally {
            setLoading(false);
        }
    };
    const getScheduleEntry = (teacherId, period, day) => {
        return masterSchedule.find(entry => entry.teacherId === teacherId &&
            entry.period === period &&
            (entry.dayOfWeek === day || entry.dayOfWeek === null));
    };
    const getFilteredTeachers = () => {
        if (selectedTeacher === 'all') {
            return teachers.filter(teacher => teacher.role === 'teacher' || teacher.role === 'paraprofessional');
        }
        return teachers.filter(teacher => teacher.id === selectedTeacher);
    };
    const getFreePeriods = (teacherId, day) => {
        return PERIODS.filter(period => {
            const entry = getScheduleEntry(teacherId, period, day);
            return !entry || !entry.isTeaching;
        });
    };
    const getTeachingPeriods = (teacherId, day) => {
        return PERIODS.filter(period => {
            const entry = getScheduleEntry(teacherId, period, day);
            return entry && entry.isTeaching;
        });
    };
    const getNonTeachingPeriods = (teacherId) => {
        return PERIODS.filter(period => {
            const entry = getScheduleEntry(teacherId, period, selectedDay);
            return !entry || !entry.isTeaching;
        });
    };
    const getLoad = (teacherId) => getTeachingPeriods(teacherId, selectedDay).length;
    const handleSort = (key) => {
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
        if (key === 'name' || key === 'department' || key === 'role') {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[key] || '';
                const bVal = b[key] || '';
                if (aVal < bVal)
                    return direction === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        else if (PERIODS.includes(key)) {
            filtered = [...filtered].sort((a, b) => {
                const aEntry = getScheduleEntry(a.id, key, selectedDay);
                const bEntry = getScheduleEntry(b.id, key, selectedDay);
                const aVal = aEntry ? (aEntry.isTeaching ? aEntry.subject : 'FREE') : '';
                const bVal = bEntry ? (bEntry.isTeaching ? bEntry.subject : 'FREE') : '';
                if (aVal < bVal)
                    return direction === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        else if (key === 'freePeriods') {
            filtered = [...filtered].sort((a, b) => {
                const aVal = getFreePeriods(a.id, selectedDay).length;
                const bVal = getFreePeriods(b.id, selectedDay).length;
                if (aVal < bVal)
                    return direction === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    };
    const startEdit = (teacherId) => {
        setEditRow(teacherId);
        const periods = {};
        PERIODS.forEach(p => {
            const entry = getScheduleEntry(teacherId, p, selectedDay);
            periods[p] = entry ? (entry.isTeaching ? `${entry.subject} (${entry.room})` : (entry.subject || entry.type || '')) : '';
        });
        setEditData({ ...teachers.find(t => t.id === teacherId), periods });
    };
    const cancelEdit = () => {
        setEditRow(null);
        setEditData({});
    };
    const saveEdit = async (teacherId) => {
        // TODO: API call to save changes
        setEditRow(null);
        setEditData({});
        fetchData();
    };
    const handleEditChange = (field, value) => {
        setEditData((prev) => ({ ...prev, [field]: value }));
    };
    const handlePeriodEdit = (period, value) => {
        setEditData((prev) => ({ ...prev, periods: { ...prev.periods, [period]: value } }));
    };
    const handleAdd = () => {
        // TODO: API call to add new teacher/schedule
        fetchData();
    };
    const handleDelete = (teacherId) => {
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
            }
            else {
                setError('Failed to add teacher');
            }
        }
        catch (e) {
            setError('Failed to add teacher');
        }
        finally {
            setAddLoading(false);
        }
    };
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
    }
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      <div className="w-full flex justify-center mt-4 mb-2">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-6 py-2 text-lg font-bold text-yellow-800 shadow">
          Total Free Periods Today: {getFilteredTeachers().reduce((total, teacher) => total + getFreePeriods(teacher.id, selectedDay).length, 0)}
        </div>
      </div>
      <div className="flex flex-col items-center py-8 px-4">
        <div className="flex flex-col items-center mb-8">
          <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2"/>
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
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
                {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
              </select>
              <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="border border-gray-300 rounded px-3 py-2">
                <option value="all">All Teachers</option>
                {teachers
            .filter(teacher => teacher.role === 'teacher' || teacher.role === 'paraprofessional')
            .map(teacher => (<option key={teacher.id} value={teacher.id}>{teacher.name}</option>))}
              </select>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Total Teachers</h3>
              <p className="text-2xl font-bold text-blue-600">
                {teachers.filter(t => t.role === 'teacher').length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Paraprofessionals</h3>
              <p className="text-2xl font-bold text-green-600">
                {teachers.filter(t => t.role === 'paraprofessional').length}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800">Free Periods Today</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {getFilteredTeachers().reduce((total, teacher) => total + getFreePeriods(teacher.id, selectedDay).length, 0)}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800">Teaching Periods</h3>
              <p className="text-2xl font-bold text-purple-600">
                {getFilteredTeachers().reduce((total, teacher) => total + getTeachingPeriods(teacher.id, selectedDay).length, 0)}
              </p>
            </div>
          </div>

          {/* Master Schedule Table */}
          <div className="flex justify-end mb-4">
            <button className="bg-indigo-700 text-white font-semibold px-4 py-2 rounded hover:bg-indigo-800 text-xs" onClick={() => setShowAddTeacher(v => !v)}>
              {showAddTeacher ? 'Cancel' : 'Add Teacher'}
            </button>
          </div>
          {showAddTeacher && (<div className="mb-4 bg-gray-50 border border-gray-200 rounded p-4 flex flex-col gap-2 max-w-md mx-auto">
              <div className="flex gap-2">
                <input className="border px-2 py-1 rounded text-xs flex-1" placeholder="Name" value={newTeacher.name} onChange={e => setNewTeacher(nt => ({ ...nt, name: e.target.value }))}/>
                <input className="border px-2 py-1 rounded text-xs flex-1" placeholder="Department" value={newTeacher.department} onChange={e => setNewTeacher(nt => ({ ...nt, department: e.target.value }))}/>
                <select className="border px-2 py-1 rounded text-xs" value={newTeacher.role} onChange={e => setNewTeacher(nt => ({ ...nt, role: e.target.value }))}>
                  <option value="teacher">Teacher</option>
                  <option value="paraprofessional">Paraprofessional</option>
                </select>
              </div>
              <button className="bg-green-600 text-white rounded px-3 py-1 text-xs font-semibold mt-2 disabled:opacity-50" onClick={handleAddTeacher} disabled={addLoading || !newTeacher.name || !newTeacher.department}>
                {addLoading ? 'Adding...' : 'Add'}
              </button>
            </div>)}
          <div className="overflow-x-auto">
            <table className="min-w-max bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100 text-xs">
                  <th className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort('name')}>Tchr</th>
                  <th className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort('department')}>Dept</th>
                  <th className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort('role')}>Role</th>
                  <th className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort('load')}>Load</th>
                  {PERIODS.map((p, i) => (<th key={p} className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort(p)}>{`P${i + 1}`}</th>))}
                  <th className="px-0.5 py-0.5 cursor-pointer" title="Free Periods (list)" onClick={() => handleSort('freePeriods')}>Free</th>
                  <th className="px-0.5 py-0.5 cursor-pointer" onClick={() => handleSort('actions')}>Act</th>
                </tr>
              </thead>
              <tbody>
                {getSortedTeachers().map(t => (<tr key={t.id} className={editRow === t.id ? 'bg-yellow-50' : ''}>
                    <td className="px-0.5 py-0.5 text-xs font-medium">{editRow === t.id ? <input value={editData.name} onChange={e => handleEditChange('name', e.target.value)} className="w-24 text-xs px-1 py-1"/> : <span>{t.role === 'teacher' ? '👨‍🏫' : t.role === 'paraprofessional' ? '🧑‍💼' : ''} {t.name}</span>}</td>
                    <td className="px-0.5 py-0.5 text-xs">{editRow === t.id ? <input value={editData.department} onChange={e => handleEditChange('department', e.target.value)} className="w-16 text-xs px-1 py-1"/> : <span className="text-xs">{(t.department || '').slice(0, 3).toUpperCase()}</span>}</td>
                    <td className="px-0.5 py-0.5 text-xs">{editRow === t.id ? <input value={editData.role} onChange={e => handleEditChange('role', e.target.value)} className="w-10 text-xs px-1 py-1"/> : <span className="text-xs">{(t.role || '').slice(0, 3).toUpperCase()}</span>}</td>
                    <td className="px-0.5 py-0.5 text-xs">{getLoad(t.id)}</td>
                    {PERIODS.map((p, i) => (<td key={p} className="px-0.5 py-0.5 text-xs text-gray-700 whitespace-nowrap">
                        {editRow === t.id ? (<input value={editData.periods?.[p] || ''} onChange={e => handlePeriodEdit(p, e.target.value)} placeholder="Subject/Room or Type" className="w-16 text-xs px-1 py-1"/>) : ((() => {
                    const entry = getScheduleEntry(t.id, p, selectedDay);
                    if (!entry || (!entry.isTeaching && !entry.subject && !entry.type))
                        return <span className="bg-blue-200 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">Free</span>;
                    if (entry.isTeaching) {
                        const abbr = abbreviateSubject(entry.subject);
                        const dept = t.department || 'Other';
                        const colorClass = DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS['Other'];
                        return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${colorClass}`}>{abbr} <span className="text-gray-400">({entry.room})</span></span>;
                    }
                    return <span>{(() => {
                            const label = abbreviateSubject(entry.subject || entry.type);
                            return label + (entry.room && entry.room !== 'N/A' ? ` (${entry.room})` : '');
                        })()}</span>;
                })())}
                      </td>))}
                    <td className="px-0.5 py-0.5 text-xs">{getFreePeriods(t.id, selectedDay)
                .map(p => `P${PERIODS.indexOf(p) + 1}`)
                .join(', ')}</td>
                    <td className="px-0.5 py-0.5 text-xs">
                      <div className="flex space-x-2">
                        <button onClick={() => startEdit(t.id)} className="text-indigo-700 font-semibold hover:underline">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-700 font-semibold hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          {success && (<div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
              {success}
            </div>)}
          {error && (<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
              {error}
            </div>)}
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-600 flex gap-4">
        <span>👨‍🏫 = Teacher</span>
        <span>🧑‍💼 = Paraprofessional</span>
        <span><span className="bg-blue-200 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">Free</span> = Free Period</span>
      </div>
    </div>);
}
