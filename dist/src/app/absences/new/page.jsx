"use client";
import { useState, useEffect } from "react";
import MetricsTicker from "../../../components/MetricsTicker";
const demoTeachers = [
    { name: "John Smith", department: "Math" },
    { name: "Sarah Jones", department: "English" },
    { name: "Emily Brown", department: "Science" },
    { name: "Michael Lee", department: "History" },
    { name: "Jessica White", department: "Art" },
    { name: "David Kim", department: "Music" },
    { name: "Laura Green", department: "PE" },
    { name: "James Black", department: "Math" },
    { name: "Olivia Clark", department: "English" },
    { name: "William Turner", department: "Science" },
    { name: "Sophia Martinez", department: "Math" },
    { name: "Benjamin Harris", department: "English" },
    { name: "Ava Nelson", department: "Science" },
    { name: "Ethan Walker", department: "History" },
    { name: "Mia Hall", department: "Art" },
    { name: "Alexander Young", department: "Music" },
    { name: "Charlotte King", department: "PE" },
    { name: "Daniel Wright", department: "Math" },
    { name: "Amelia Scott", department: "English" },
    { name: "Matthew Adams", department: "Science" },
    { name: "Harper Baker", department: "History" },
    { name: "Elijah Gonzalez", department: "Art" },
    { name: "Abigail Perez", department: "Music" },
    { name: "Logan Roberts", department: "PE" },
    { name: "Emily Evans", department: "Math" },
    { name: "Jacob Edwards", department: "English" },
    { name: "Madison Collins", department: "Science" },
    { name: "Lucas Stewart", department: "History" },
    { name: "Ella Sanchez", department: "Art" },
    { name: "Mason Morris", department: "Music" },
    { name: "Lily Rogers", department: "PE" },
    { name: "Carter Reed", department: "Math" },
    { name: "Grace Cook", department: "English" },
    { name: "Henry Morgan", department: "Science" },
    { name: "Chloe Bell", department: "History" },
    { name: "Sebastian Murphy", department: "Art" },
    { name: "Victoria Bailey", department: "Music" },
    { name: "Jack Rivera", department: "PE" },
    { name: "Penelope Cooper", department: "Math" },
    { name: "Samuel Richardson", department: "English" },
    { name: "Scarlett Cox", department: "Science" },
    { name: "Owen Howard", department: "History" },
    { name: "Layla Ward", department: "Art" },
    { name: "Wyatt Torres", department: "Music" },
    { name: "Zoe Peterson", department: "PE" },
    { name: "Julian Gray", department: "Math" },
    { name: "Hannah Ramirez", department: "English" },
    { name: "Levi James", department: "Science" },
    { name: "Aria Watson", department: "History" },
    { name: "Dylan Brooks", department: "Art" },
    { name: "Nora Kelly", department: "Music" },
    { name: "Mila Foster", department: "PE" },
    { name: "Gabriel Price", department: "Math" },
    { name: "Avery Bennett", department: "English" },
    { name: "Luke Barnes", department: "Science" },
    { name: "Ella Russell", department: "History" },
    { name: "Hudson Griffin", department: "Art" },
    { name: "Savannah Hayes", department: "Music" },
    { name: "Lincoln Butler", department: "PE" },
    { name: "Camila Simmons", department: "Math" },
    { name: "Jackson Foster", department: "English" },
    { name: "Scarlett Powell", department: "Science" },
    { name: "Mason Ward", department: "History" },
    { name: "Layla Bryant", department: "Art" },
    { name: "Aiden Wood", department: "Music" },
    { name: "Evelyn Perry", department: "PE" },
    { name: "Lucas Brooks", department: "Math" },
    { name: "Zoey Reed", department: "English" },
    { name: "Leah Kelly", department: "Science" },
    { name: "Nathan Sanders", department: "History" },
    { name: "Stella Price", department: "Art" },
    { name: "Caleb Bennett", department: "Music" },
    { name: "Hazel Barnes", department: "PE" },
    { name: "Isaac Russell", department: "Math" },
    { name: "Aurora Griffin", department: "English" },
    { name: "Elena Hayes", department: "Science" },
    { name: "Christian Butler", department: "History" },
    { name: "Paisley Simmons", department: "Art" },
    { name: "Easton Foster", department: "Music" },
    { name: "Penelope Powell", department: "PE" }
];
// Sort teachers alphabetically by last name
const sortedTeachers = [...demoTeachers].sort((a, b) => {
    const aLast = a.name.split(" ").slice(-1)[0].toLowerCase();
    const bLast = b.name.split(" ").slice(-1)[0].toLowerCase();
    return aLast.localeCompare(bLast);
});
const absenceTypes = [
    "Full Day",
    "Half Day AM",
    "Half Day PM",
    "Specific Periods"
];
const periods = [
    "Period 1",
    "Period 2",
    "Period 3",
    "Period 4",
    "Period 5",
    "Period 6",
    "Period 7",
    "Period 8",
];
const reasons = [
    "Sick",
    "Personal",
    "Professional Development",
    "Family Emergency",
    "Jury Duty",
    "Other",
];
// Only consider these as valid weekdays
const VALID_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// Helper: get next valid weekday (Monday-Friday)
function getNextValidWeekday(date = new Date()) {
    let d = new Date(date);
    let day = d.getDay();
    if (day === 6)
        d.setDate(d.getDate() + 2); // Saturday -> Monday
    if (day === 0)
        d.setDate(d.getDate() + 1); // Sunday -> Monday
    return d.toISOString().split('T')[0];
}
function isWeekend(dateStr) {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
}
export default function ReportAbsencePage() {
    const defaultDate = getNextValidWeekday();
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
    const [teacher, setTeacher] = useState("");
    const [schoolId, setSchoolId] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [date, setDate] = useState(defaultDate);
    const [absenceType, setAbsenceType] = useState(absenceTypes[0]);
    const [teachingPeriods, setTeachingPeriods] = useState([]);
    const [amPeriods, setAmPeriods] = useState([]);
    const [pmPeriods, setPmPeriods] = useState([]);
    const [success, setSuccess] = useState("");
    const [errors, setErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [dateError, setDateError] = useState("");
    useEffect(() => {
        fetch("/api/teachers")
            .then((res) => res.json())
            .then((data) => setTeachers(data));
        // Fetch AM/PM period mapping from schedule config
        fetch("/api/admin/schedule-configs")
            .then(res => res.json())
            .then(configs => {
            const active = configs.find((c) => c.isActive);
            if (active && active.config) {
                setAmPeriods(active.config.amPeriods || ["Period 1", "Period 2", "Period 3", "Period 4"]);
                setPmPeriods(active.config.pmPeriods || ["Period 5", "Period 6", "Period 7", "Period 8"]);
            }
            else {
                setAmPeriods(["Period 1", "Period 2", "Period 3", "Period 4"]);
                setPmPeriods(["Period 5", "Period 6", "Period 7", "Period 8"]);
            }
        });
    }, []);
    useEffect(() => {
        if (selectedTeacherIds.length !== 1 || !date) {
            setTeachingPeriods([]);
            return;
        }
        const teacherId = selectedTeacherIds[0];
        fetch(`/api/master-schedule?teacherId=${teacherId}`)
            .then((res) => res.json())
            .then((data) => {
            // Compute the day name in the same format as master schedule
            const d = new Date(date);
            const computedDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
            // Normalize function
            const normalizeDay = (s) => (s || '').toLowerCase().trim();
            console.log('Computed day:', computedDay, '| Master schedule days:', Array.from(new Set(data.map((item) => item.dayOfWeek))));
            // Only include periods where isTeaching is true and dayOfWeek matches computed day and is a valid weekday
            const periods = Array.from(new Set(data.filter((item) => item.isTeaching === true && VALID_WEEKDAYS.includes(item.dayOfWeek) && normalizeDay(item.dayOfWeek) === normalizeDay(computedDay)).map((item) => String(item.period)))).sort();
            setTeachingPeriods(periods);
        });
    }, [selectedTeacherIds, date]);
    const handleTeacherChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setSelectedTeacherIds(selectedOptions);
        if (selectedOptions.length === 1) {
            const selected = teachers.find((t) => t.id === selectedOptions[0]);
            setSchoolId(selected ? selected.schoolId : "");
        }
        else {
            setSchoolId("");
        }
    };
    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setDate(selectedDate);
        if (isWeekend(selectedDate)) {
            setDateError("Weekends are not allowed. Please select a weekday (Monday-Friday).");
        }
        else {
            setDateError("");
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate required fields
        const validationErrors = [];
        if (selectedTeacherIds.length === 0) {
            validationErrors.push("Please select at least one teacher");
        }
        if (!date) {
            validationErrors.push("Please select a date");
        }
        if (isWeekend(date)) {
            validationErrors.push("Please select a weekday (Monday-Friday)");
        }
        // Check for duplicate teacher/department pairs
        const selectedPairs = selectedTeacherIds.map(id => {
            const t = teachers.find((tt) => tt.id === id);
            return t ? `${t.id}|${t.department}` : '';
        });
        const pairSet = new Set(selectedPairs);
        if (pairSet.size !== selectedPairs.length) {
            validationErrors.push("Duplicate teacher and department selected. Please remove duplicates.");
        }
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }
        setSubmitting(true);
        setError("");
        setSuccess("");
        setErrors([]);
        // Debug log
        const d = new Date(date);
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
        console.log(`Submitting absence for date: ${date} (${dayName})`);
        console.log('Form data:', {
            selectedTeacherIds,
            schoolId,
            date,
            absenceType,
            periods: teachingPeriods
        });
        try {
            let allOk = true;
            let allResults = [];
            for (const teacherId of selectedTeacherIds) {
                const t = teachers.find((tt) => tt.id === teacherId);
                let periodsToReport = teachingPeriods;
                // Normalization: extract period number from any label
                const getPeriodNumber = (label) => {
                    const match = label.match(/(\d+)/);
                    return match ? parseInt(match[1], 10) : null;
                };
                if (absenceType === "Half Day AM") {
                    periodsToReport = teachingPeriods.filter(p => {
                        const num = getPeriodNumber(p);
                        return num && num >= 1 && num <= 4;
                    });
                }
                else if (absenceType === "Half Day PM") {
                    periodsToReport = teachingPeriods.filter(p => {
                        const num = getPeriodNumber(p);
                        return num && num >= 5 && num <= 8;
                    });
                }
                // For all types, use periodsToReport (no manual selection)
                const response = await fetch('/api/absences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        teacherId: teacherId,
                        schoolId: t?.schoolId,
                        date: date,
                        absenceType: absenceType,
                        notes: '',
                        periods: periodsToReport,
                    }),
                });
                const result = await response.json();
                allResults.push(result);
                if (!response.ok)
                    allOk = false;
            }
            if (allOk) {
                setSuccess(`Absence(s) reported successfully!`);
                setSelectedTeacherIds([]);
                setTeacher("");
                setSchoolId("");
                setAbsenceType(absenceTypes[0]);
            }
            else {
                setError(allResults.map(r => r.error).filter(Boolean).join('; ') || 'Failed to report absence');
            }
        }
        catch (error) {
            console.error('Error reporting absence:', error);
            setError('Network error. Please try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      <div className="flex flex-col items-center py-8 px-4">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8">
        <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2"/>
        <h1 className="text-3xl font-bold text-indigo-800">PlanD Absence Management System</h1>
        <p className="text-indigo-600 font-medium">Chaos is not Scheduled</p>
        <span className="text-xs text-gray-500 mt-1">A Significant Consulting Product</span>
      </div>
      {/* Navigation */}
      <nav className="mb-8 flex space-x-6">
        <a href="/absences/new" className="text-indigo-700 font-semibold underline">Report Absence</a>
        <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
        <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
      </nav>
      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-indigo-800 mb-6">Report Teacher Absence</h2>
        <p className="text-sm text-gray-600 mb-4">
          <span className="text-red-500">*</span> Required fields
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teacher/Staff <span className="text-red-500">*</span>
            </label>
            <select className={`w-full border rounded px-3 py-2 ${selectedTeacherIds.length === 0 ? 'border-red-300' : 'border-gray-300'}`} value={selectedTeacherIds} onChange={handleTeacherChange} multiple required size={Math.min(teachers.length, 8)}>
              {[...teachers].sort((a, b) => {
            const aLast = a.name.split(' ').slice(-1)[0].toLowerCase();
            const bLast = b.name.split(' ').slice(-1)[0].toLowerCase();
            return aLast.localeCompare(bLast);
        }).map((t) => (<option key={t.id} value={t.id}>{t.name} - {t.department}</option>))}
            </select>
            {selectedTeacherIds.length === 0 && (<p className="text-red-600 text-sm mt-1">Please select at least one teacher</p>)}
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple teachers.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input type="date" className={`w-full border rounded px-3 py-2 ${dateError ? 'border-red-500' : 'border-gray-300'}`} value={date} onChange={handleDateChange} min={defaultDate} required/>
            {dateError && (<p className="text-red-600 text-sm mt-1">{dateError}</p>)}
            <p className="text-gray-500 text-xs mt-1">Only weekdays (Monday-Friday) are allowed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absence Type</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2" value={absenceType} onChange={e => setAbsenceType(e.target.value)}>
              {absenceTypes.map((type, i) => (<option key={i} value={type}>{type}</option>))}
            </select>
          </div>
          {errors.length > 0 && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              <div className="font-medium mb-1">Please fix the following errors:</div>
              {errors.map((err, i) => <div key={i}>• {err}</div>)}
            </div>)}
          <button type="submit" disabled={submitting || !!dateError} className={`w-full font-semibold py-2 rounded transition ${submitting || dateError
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-700 hover:bg-indigo-800 text-white'}`}>
            {submitting ? 'Submitting...' : 'Submit Absence'}
          </button>
          {success && (<div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
              {success}
            </div>)}
          {error && (<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
              {error}
            </div>)}
        </form>
      </div>
      </div>
    </div>);
}
