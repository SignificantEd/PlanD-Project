"use client";
import { useState, useEffect } from "react";
import MetricsTicker from "../../../components/MetricsTicker";
import { sortByLastName } from '../../../lib/sortByLastName';
import { getPeriodsToCover } from '../masterSchedule';

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
  "Custom"
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
  if (day === 6) d.setDate(d.getDate() + 2); // Saturday -> Monday
  if (day === 0) d.setDate(d.getDate() + 1); // Sunday -> Monday
  return d.toISOString().split('T')[0]; // Returns date string
}

// Helper: validate and ensure date string
function ensureYYYYMMDDFormat(dateStr: string): string {
  // Check if already in date string
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and convert to date string
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function isWeekend(dateStr: string) {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// Utility: Extract last name for sorting
function getLastName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function getDisplayName(t: any) {
  const names = t.name.trim().split(' ');
  const firstInitial = names[0] ? names[0][0].toUpperCase() + '.' : '';
  const lastName = names.length > 1 ? names[names.length - 1] : names[0];
  const deptAbbr = (t.department || '').slice(0, 3).toUpperCase();
  return `${firstInitial} ${lastName} (${deptAbbr})`;
}

export default function ReportAbsencePage() {
  const defaultDate = getNextValidWeekday();
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacher, setTeacher] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [date, setDate] = useState(defaultDate);
  const [absenceType, setAbsenceType] = useState(absenceTypes[0]);
  const [teachingPeriods, setTeachingPeriods] = useState<string[]>([]);
  const [amPeriods, setAmPeriods] = useState<string[]>([]);
  const [pmPeriods, setPmPeriods] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");
  const [customPeriods, setCustomPeriods] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/teachers")
      .then((res) => res.json())
      .then((data) => setTeachers(data));
    // Fetch AM/PM period mapping from schedule config
    fetch("/api/admin/schedule-configs")
      .then(res => res.json())
      .then(configs => {
        const active = configs.find((c: any) => c.isActive);
        if (active && active.config) {
          setAmPeriods(active.config.amPeriods || ["Period 1", "Period 2", "Period 3", "Period 4"]);
          setPmPeriods(active.config.pmPeriods || ["Period 5", "Period 6", "Period 7", "Period 8"]);
        } else {
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
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        const d = new Date(year, month - 1, day); // month is 0-indexed
        const computedDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
        // Normalize function
        const normalizeDay = (s: string) => (s || '').toLowerCase().trim();
        console.log('Computed day:', computedDay, '| Master schedule days:', Array.from(new Set(data.map((item: any) => item.dayOfWeek))));
        console.log('Raw master schedule data:', data);
        // Only include periods where isTeaching is true and dayOfWeek matches computed day and is a valid weekday
        // Use the actual period format from master schedule (e.g., "1st", "2nd")
        const filteredData = data.filter((item: any) => {
          const isTeaching = item.isTeaching === true;
          // Handle both specific day schedules and daily schedules
          const isValidWeekday = item.dayOfWeek === null || VALID_WEEKDAYS.includes(item.dayOfWeek);
          const dayMatches = item.dayOfWeek === null || normalizeDay(item.dayOfWeek) === normalizeDay(computedDay);
          console.log(`Period ${item.period}: isTeaching=${isTeaching}, isValidWeekday=${isValidWeekday}, dayMatches=${dayMatches} (${item.dayOfWeek} vs ${computedDay})`);
          return isTeaching && isValidWeekday && dayMatches;
        });
        const periods = Array.from(new Set(filteredData.map((item: any) => String(item.period)))).sort();
        setTeachingPeriods(periods as string[]);
      });
  }, [selectedTeacherIds, date]);

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSelectedTeacherIds(selectedOptions);
    if (selectedOptions.length === 1) {
      const selected = teachers.find((t: any) => t.id === selectedOptions[0]);
    setSchoolId(selected ? selected.schoolId : "");
    } else {
      setSchoolId("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    
    // Ensure the date is in YYYY-MM-DD format
    try {
      const formattedDate = ensureYYYYMMDDFormat(selectedDate);
      console.log(`Date input: ${selectedDate} -> Formatted: ${formattedDate}`);
      setDate(formattedDate);
      
      if (isWeekend(formattedDate)) {
        setDateError("Weekends are not allowed. Please select a weekday (Monday-Friday).");
      } else {
        setDateError("");
      }
    } catch (error) {
      console.error('Invalid date format:', selectedDate);
      setDateError("Invalid date value.");
    }
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow partial input while typing
    if (inputValue.length === 0) {
      setDate("");
      setDateError("");
      return;
    }
    
    // Check if it's a complete YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      try {
        const formattedDate = ensureYYYYMMDDFormat(inputValue);
        setDate(formattedDate);
        
        if (isWeekend(formattedDate)) {
          setDateError("Weekends are not allowed. Please select a weekday (Monday-Friday).");
        } else {
          setDateError("");
        }
      } catch (error) {
        setDateError("Invalid date value.");
      }
    } else {
      // Allow partial input, but show format hint
      setDate(inputValue);
      if (inputValue.length > 0 && !/^\d{4}-\d{0,2}-\d{0,2}$/.test(inputValue)) {
        setDateError("Please enter a valid date.");
      } else {
        setDateError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    // Validate Custom absence type has selected periods
    if (absenceType === 'Custom' && customPeriods.length === 0) {
      validationErrors.push("Please select at least one period for Custom absence type");
    }
    
    // Check for duplicate teacher/department pairs
    const selectedPairs = selectedTeacherIds.map(id => {
      const t = teachers.find((tt: any) => tt.id === id);
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
    
    // Ensure date is in YYYY-MM-DD format before submission
    const formattedDate = ensureYYYYMMDDFormat(date);
    console.log(`Submitting absence for date: ${formattedDate} (${dayName})`);
    console.log('Form data:', {
      selectedTeacherIds,
      schoolId,
      date: formattedDate,
      absenceType,
      periods: teachingPeriods
    });
    
    try {
      let allOk = true;
      let allResults: any[] = [];
      for (const teacherId of selectedTeacherIds) {
        const t = teachers.find((tt: any) => tt.id === teacherId);
        let periodsToReport = teachingPeriods;
        // Normalization: extract period number from any label
        const getPeriodNumber = (label: string) => {
          const match = label.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        };
        // Use getPeriodsToCover utility for robust logic
        const periodsToCover = getPeriodsToCover(
          teachingPeriods.map(p => ({ period: p, subject: '', room: '', isTeaching: true })),
          absenceType as any,
          absenceType === 'Custom' ? customPeriods : undefined
        );
        if (absenceType === "Half Day AM") {
          periodsToReport = teachingPeriods.filter(p => {
            const num = getPeriodNumber(p);
            return num && num >= 1 && num <= 4;
          });
        } else if (absenceType === "Half Day PM") {
          periodsToReport = teachingPeriods.filter(p => {
            const num = getPeriodNumber(p);
            return num && num >= 5 && num <= 8;
          });
        } else if (absenceType === 'Custom') {
          periodsToReport = customPeriods.filter(p => teachingPeriods.includes(p));
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
          date: formattedDate,
          absenceType: absenceType,
            notes: '',
            periods: periodsToReport,
            periodsToCover, // NEW: send correct periods to cover
        }),
      });
        const result = await response.json();
        allResults.push(result);
        if (!response.ok) {
          allOk = false;
          setError(result.error || 'Failed to create absence'); // Show real error
        }
      }
      if (allOk) {
        setSuccess(`Absence(s) reported successfully!`);
        setSelectedTeacherIds([]);
        setTeacher("");
        setSchoolId("");
        setAbsenceType(absenceTypes[0]);
        // Stay on this page after submission (no redirect)
      } else {
        setError(allResults.map(r => r.error).filter(Boolean).join('; ') || 'Failed to report absence');
      }
    } catch (error: any) {
      console.error('Error reporting absence:', error);
      setError(error?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      <div className="flex flex-col items-center py-8 px-4">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8">
        <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2" />
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
            <select
              className={`w-full border rounded px-3 py-2 ${selectedTeacherIds.length === 0 ? 'border-red-300' : 'border-gray-300'}`}
              value={selectedTeacherIds}
              onChange={handleTeacherChange}
              multiple
              required
              size={Math.min(teachers.length, 8)}
            >
              {sortByLastName(teachers).map((t) => (
                <option key={t.id} value={t.id}>{getDisplayName(t)}</option>
              ))}
            </select>
            {selectedTeacherIds.length === 0 && (
              <p className="text-red-600 text-sm mt-1">Please select at least one teacher</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple teachers.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            
            <input
              type="text"
              placeholder="e.g., 2025-07-09"
              className={`w-full border rounded px-3 py-2 ${dateError ? 'border-red-500' : 'border-gray-300'}`}
              value={date}
              onChange={handleManualDateChange}
              required
            />
            
            {dateError && (
              <p className="text-red-600 text-sm mt-1">{dateError}</p>
            )}
            {date && !dateError && (
              <p className="text-green-600 text-xs mt-1">
                ✓ Date set: {date}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Only weekdays (Monday-Friday) are allowed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absence Type</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={absenceType}
              onChange={e => {
                setAbsenceType(e.target.value);
                if (e.target.value !== 'Custom') setCustomPeriods([]);
              }}
            >
              {absenceTypes.map((type, i) => (
                <option key={i} value={type}>{type}</option>
              ))}
            </select>
            {absenceType === 'Custom' && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Select the specific periods for this absence:</p>
                {teachingPeriods.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {teachingPeriods.map(period => (
                        <label key={period} className="flex items-center space-x-1 text-xs">
                  <input
                    type="checkbox"
                            checked={customPeriods.includes(period)}
                            onChange={e => {
                              if (e.target.checked) setCustomPeriods([...customPeriods, period]);
                              else setCustomPeriods(customPeriods.filter(p => p !== period));
                            }}
                  />
                  <span>{period}</span>
                </label>
              ))}
                    </div>
                    {customPeriods.length > 0 && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        <strong>Selected periods:</strong> {customPeriods.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No teaching periods found for this teacher on the selected date.</p>
                )}
            </div>
          )}
          </div>
          {errors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              <div className="font-medium mb-1">Please fix the following errors:</div>
              {errors.map((err, i) => <div key={i}>• {err}</div>)}
            </div>
          )}
          
          {/* Button Container */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting || !!dateError}
              className={`bg-indigo-700 text-white px-6 py-3 rounded font-semibold hover:bg-indigo-800 transition flex-1 ${submitting || dateError ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Submitting...' : 'Submit Absence'}
            </button>
            
            <button
              type="button"
              onClick={() => window.location.href = '/absences/assign'}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
            >
              Assign Coverage
            </button>
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
        </form>
      </div>
      </div>
    </div>
  );
} 