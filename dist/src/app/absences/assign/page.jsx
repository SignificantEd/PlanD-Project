"use client";
import { useState, useEffect } from "react";
import MetricsTicker from "../../../components/MetricsTicker";
function getTodayDayOfWeek() {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}
// Add a normalization function for period labels
function normalizePeriodLabel(label) {
    // Extract the first number found in the label, or fallback to lowercase trimmed
    const match = label.match(/\d+/);
    if (match)
        return match[0];
    return label.toLowerCase().replace(/period|st|nd|rd|th|p/gi, '').trim();
}
export default function CoverageAssignmentPage() {
    const [absences, setAbsences] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [masterSchedules, setMasterSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customPeriods, setCustomPeriods] = useState([]);
    const [selectedSubstitute, setSelectedSubstitute] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [substitutes, setSubstitutes] = useState([]);
    const [absentTeacherIdsByDate, setAbsentTeacherIdsByDate] = useState({});
    useEffect(() => {
        fetchData();
        fetch('/api/substitutes/all')
            .then(res => res.json())
            .then(data => setSubstitutes(data));
        // Build a map of absent teacher IDs by date
        fetch('/api/absences')
            .then(res => res.json())
            .then(absences => {
            const map = {};
            absences.forEach((a) => {
                const dateStr = new Date(a.date).toISOString().split('T')[0];
                if (!map[dateStr])
                    map[dateStr] = new Set();
                map[dateStr].add(a.teacherId);
            });
            setAbsentTeacherIdsByDate(map);
        });
    }, []);
    const fetchData = async () => {
        try {
            const [absRes, teachersRes, msRes] = await Promise.all([
                fetch('/api/absences'),
                fetch('/api/teachers'),
                fetch('/api/master-schedule'),
            ]);
            const absData = await absRes.json();
            const teachersData = await teachersRes.json();
            const msData = await msRes.json();
            setAbsences(absData);
            setTeachers(teachersData);
            setMasterSchedules(msData);
        }
        catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleClearAllAbsences = async () => {
        if (confirm('Are you sure you want to delete ALL absences and coverage assignments? This cannot be undone.')) {
            try {
                const response = await fetch('/api/admin/clear-absences', { method: 'DELETE' });
                if (response.ok) {
                    setAbsences([]);
                    setSuccess('All absences and coverage assignments have been cleared.');
                    setTimeout(() => setSuccess(""), 3000);
                }
                else {
                    setError('Failed to clear absences.');
                    setTimeout(() => setError(""), 3000);
                }
            }
            catch (error) {
                console.error('Error clearing absences:', error);
                setError('Error clearing absences.');
                setTimeout(() => setError(""), 3000);
            }
        }
    };
    const handleReassign = async (coverageId, newTeacherId) => {
        try {
            const response = await fetch('/api/coverage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: coverageId,
                    assignedTeacherId: newTeacherId,
                }),
            });
            if (response.ok) {
                await fetchData(); // Refresh data
                setSuccess('Coverage reassigned successfully!');
                setTimeout(() => setSuccess(""), 3000);
            }
            else {
                setError('Failed to reassign coverage.');
                setTimeout(() => setError(""), 3000);
            }
        }
        catch (error) {
            console.error('Error reassigning coverage:', error);
            setError('Error reassigning coverage.');
            setTimeout(() => setError(""), 3000);
        }
    };
    const handleDeleteAssignment = async (coverageId) => {
        if (confirm('Are you sure you want to delete this coverage assignment?')) {
            try {
                const response = await fetch(`/api/coverage?id=${coverageId}`, { method: 'DELETE' });
                if (response.ok) {
                    await fetchData(); // Refresh data
                    setSuccess('Coverage assignment deleted successfully!');
                    setTimeout(() => setSuccess(""), 3000);
                }
                else {
                    setError('Failed to delete coverage assignment.');
                    setTimeout(() => setError(""), 3000);
                }
            }
            catch (error) {
                console.error('Error deleting coverage assignment:', error);
                setError('Error deleting coverage assignment.');
                setTimeout(() => setError(""), 3000);
            }
        }
    };
    const handleConfirmAssignment = async (coverageId) => {
        try {
            const response = await fetch('/api/coverage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: coverageId,
                    status: 'confirmed',
                }),
            });
            if (response.ok) {
                await fetchData(); // Refresh data
                setSuccess('Coverage assignment confirmed!');
                setTimeout(() => setSuccess(""), 3000);
            }
            else {
                setError('Failed to confirm coverage assignment.');
                setTimeout(() => setError(""), 3000);
            }
        }
        catch (error) {
            console.error('Error confirming coverage assignment:', error);
            setError('Error confirming coverage assignment.');
            setTimeout(() => setError(""), 3000);
        }
    };
    const handleSubstituteAttendance = async (absenceId, substituteId, attendanceType, periodsWorked) => {
        try {
            const response = await fetch('/api/substitutes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    absenceId,
                    substituteId,
                    attendanceType,
                    periodsWorked,
                }),
            });
            if (response.ok) {
                const result = await response.json();
                await fetchData(); // Refresh data
                if (result.status === 'partial' && result.uncoveredPeriods) {
                    setSuccess(`Substitute attendance recorded. Backup coverage needed for periods: ${result.uncoveredPeriods.join(', ')}`);
                }
                else {
                    setSuccess('Substitute attendance recorded successfully!');
                }
                setTimeout(() => setSuccess(""), 3000);
            }
            else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to record substitute attendance');
                setTimeout(() => setError(""), 3000);
            }
        }
        catch (error) {
            console.error('Error recording substitute attendance:', error);
            setError('Error recording substitute attendance');
            setTimeout(() => setError(""), 3000);
        }
    };
    const getStepDescription = (step) => {
        const steps = {
            1: "Substitute Pool (Subject Match)",
            2: "Paraprofessionals (Available)",
            3: "Internal Teachers (Same Department)",
            4: "Internal Teachers (Cross-Department)",
            5: "Substitute Pool (Subject Mismatch)",
            6: "Paraprofessionals (Any)",
            7: "Internal Teachers (Any)",
            8: "Fallback (All Staff)"
        };
        return steps[step] || "Unknown Step";
    };
    const getAvailableTeachers = (period, schoolId, excludeTeacherId) => {
        return teachers.filter((t) => {
            if (t.id === excludeTeacherId)
                return false;
            const schedule = masterSchedules.filter((ms) => ms.teacherId === t.id &&
                ms.period === period &&
                ms.schoolId === schoolId);
            return schedule.length > 0 && schedule.every((ms) => ms.isTeaching === false);
        }).sort((a, b) => {
            const aLast = a.name.split(' ').slice(-1)[0].toLowerCase();
            const bLast = b.name.split(' ').slice(-1)[0].toLowerCase();
            return aLast.localeCompare(bLast);
        });
    };
    const handleAssignCoverage = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setAssignments([]);
        try {
            const res = await fetch('/api/coverage/assign', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to assign coverage');
            }
            else {
                setAssignments(data.assignments || []);
                setSuccess('Coverage assigned!');
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
            setLoading(false);
        }
    };
    // New handler for proprietary algorithm
    const handleAssignCoverageProprietary = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setAssignments([]);
        try {
            const res = await fetch('/api/admin/assign-coverage', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to assign coverage');
            }
            else {
                setAssignments(data.results || []);
                setSuccess(data.message || 'Coverage assigned!');
            }
        }
        catch (err) {
            setError('Network error');
        }
        finally {
            setLoading(false);
        }
    };
    // Add a handler to update the assigned substitute
    const handleReassignSub = async (coverageId, newSubId) => {
        try {
            const response = await fetch('/api/coverage', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: coverageId,
                    assignedSubstituteId: newSubId,
                }),
            });
            if (response.ok) {
                await fetchData();
                setSuccess('Substitute reassigned successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
            else {
                setError('Failed to reassign substitute.');
                setTimeout(() => setError(''), 3000);
            }
        }
        catch (error) {
            setError('Error reassigning substitute.');
            setTimeout(() => setError(''), 3000);
        }
    };
    const getTeachingPeriodsForAbsence = (absence) => {
        const date = new Date(absence.date);
        const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
        return masterSchedules
            .filter(ms => ms.teacherId === absence.teacherId && ms.dayOfWeek === dayOfWeek && ms.isTeaching)
            .map(ms => ms.period)
            .sort();
    };
    const handleConfirmAbsence = async (absenceId) => {
        try {
            const response = await fetch('/api/absences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: absenceId, status: 'confirmed' }),
            });
            if (response.ok) {
                await fetchData();
                setSuccess('Absence confirmed!');
                setTimeout(() => setSuccess(''), 3000);
            }
            else {
                setError('Failed to confirm absence.');
                setTimeout(() => setError(''), 3000);
            }
        }
        catch (error) {
            setError('Error confirming absence.');
            setTimeout(() => setError(''), 3000);
        }
    };
    const handleConfirmAllAbsences = async () => {
        try {
            const ids = absences.map(a => a.id);
            await Promise.all(ids.map(id => fetch('/api/absences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'confirmed' }),
            })));
            await fetchData();
            setSuccess('All absences confirmed!');
            setTimeout(() => setSuccess(''), 3000);
        }
        catch (error) {
            setError('Error confirming all absences.');
            setTimeout(() => setError(''), 3000);
        }
    };
    // Calculate summary stats
    const uniqueTeacherIds = new Set(absences.map(a => a.teacherId));
    let totalPeriods = 0;
    absences.forEach(absence => {
        let periods = [];
        if (Array.isArray(absence.periods)) {
            periods = absence.periods;
        }
        else if (typeof absence.periods === 'string') {
            try {
                const parsed = JSON.parse(absence.periods);
                if (Array.isArray(parsed))
                    periods = parsed;
            }
            catch { }
        }
        if (Array.isArray(periods)) {
            totalPeriods += periods.length;
        }
    });
    // Add a function to get the true periods needing coverage for all absences
    const getTotalTeachingPeriodsNeedingCoverage = () => {
        let total = 0;
        absences.forEach(absence => {
            const dateObj = new Date(absence.date);
            const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
            const msPeriods = masterSchedules
                .filter(ms => ms.teacherId === absence.teacherId && ms.dayOfWeek === dayOfWeek && ms.isTeaching)
                .map(ms => normalizePeriodLabel(String(ms.period)));
            let absencePeriods = [];
            if (Array.isArray(absence.periods)) {
                absencePeriods = absence.periods;
            }
            else if (typeof absence.periods === 'string') {
                try {
                    const parsed = JSON.parse(absence.periods);
                    if (Array.isArray(parsed))
                        absencePeriods = parsed;
                }
                catch { }
            }
            // Only count periods that are both in the absence and in the master schedule as teaching, using normalization
            const intersection = absencePeriods.filter((p) => msPeriods.includes(normalizePeriodLabel(p)));
            total += intersection.length;
        });
        return total;
    };
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
    }
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      <div className="flex flex-col items-center py-8 px-4">
        <div className="flex flex-col items-center mb-8">
          <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2"/>
          <h1 className="text-3xl font-bold text-indigo-800">PlanD Coverage Assignment</h1>
          <p className="text-indigo-600 font-medium">Chaos is not Scheduled</p>
          <span className="text-xs text-gray-500 mt-1">A Significant Consulting Product</span>
        </div>
        
        <nav className="mb-8 flex space-x-6">
          <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold underline">Assign Coverage</a>
          <a href="/substitutes" className="text-indigo-700 font-semibold hover:underline">Substitutes</a>
          <a href="/master-schedule" className="text-indigo-700 font-semibold hover:underline">Master Schedule</a>
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>

        {/* Proprietary Assign Coverage Button */}
        <div className="mb-6 w-full flex justify-center">
          <button onClick={handleAssignCoverageProprietary} className="bg-indigo-700 text-white px-6 py-3 rounded font-semibold hover:bg-indigo-800 transition" disabled={loading}>
            {loading ? 'Assigning Coverage...' : 'Assign Coverage (PlanD)'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800">Assigned Coverage Results</h2>
            <button onClick={handleClearAllAbsences} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Clear All
            </button>
            <button onClick={handleConfirmAllAbsences} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 ml-4">
              Confirm All
            </button>
          </div>

          {/* Coverage Summary */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-lg font-semibold text-indigo-700">
              Total Teachers Absent: {uniqueTeacherIds.size} | Total Periods Needing Coverage: {getTotalTeachingPeriodsNeedingCoverage()}
            </div>
          </div>

          {absences.length === 0 && (<div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-4">No absences found</div>
              <a href="/absences/new" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                Report New Absence
              </a>
            </div>)}

          {absences.map(absence => (<div key={absence.id} className="mb-8 border rounded-lg p-6 bg-gray-50">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-indigo-800">
                  {absence.teacher?.name} - {new Date(absence.date).toLocaleDateString()}
                </h3>
                <button onClick={async () => {
                if (confirm('Are you sure you want to delete this absence?')) {
                    try {
                        const res = await fetch(`/api/absences?id=${absence.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            await fetchData();
                            setSuccess('Absence deleted successfully!');
                            setTimeout(() => setSuccess(''), 3000);
                        }
                        else {
                            setError('Failed to delete absence.');
                            setTimeout(() => setError(''), 3000);
                        }
                    }
                    catch (err) {
                        setError('Error deleting absence.');
                        setTimeout(() => setError(''), 3000);
                    }
                }
            }} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 ml-4" title="Delete absence">
                  Delete
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Department:</span> {absence.teacher?.department || 'Unknown'} | 
                <span className="font-medium ml-2">Type:</span> {absence.absenceType} | 
                <span className="font-medium ml-2">Status:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${absence.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                absence.status === 'assigned' ? 'bg-green-100 text-green-800' :
                    absence.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}>
                  {absence.status}
                </span>
              </div>
              {absence.notes && (<div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Notes:</span> {absence.notes}
                </div>)}
              <div className="text-sm text-indigo-700 mt-1">
                <span className="font-medium">Teaching periods needing coverage:</span> {(() => {
                // Get periods for this teacher on this date from master schedule
                const dateObj = new Date(absence.date);
                const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
                const msPeriods = masterSchedules
                    .filter(ms => ms.teacherId === absence.teacherId && ms.dayOfWeek === dayOfWeek && ms.isTeaching)
                    .map(ms => String(ms.period));
                let absencePeriods = [];
                if (Array.isArray(absence.periods)) {
                    absencePeriods = absence.periods;
                }
                else if (typeof absence.periods === 'string') {
                    try {
                        const parsed = JSON.parse(absence.periods);
                        if (Array.isArray(parsed))
                            absencePeriods = parsed;
                    }
                    catch { }
                }
                const msPeriodsNorm = msPeriods.map(normalizePeriodLabel);
                const intersection = absencePeriods.filter((p) => msPeriodsNorm.includes(normalizePeriodLabel(p)));
                return intersection.length > 0 ? intersection.join(', ') : 'None';
            })()}
              </div>

              {absence.coverageAssignments && absence.coverageAssignments.length > 0 ? (<div className="space-y-4">
                  <h4 className="font-semibold text-indigo-700">Coverage Assignments:</h4>
                  {absence.coverageAssignments.map((coverage) => {
                    const assignedPerson = coverage.assignedTeacher || coverage.assignedSubstitute;
                    const isSubstitute = coverage.assignedSubstitute;
                    return (<div key={coverage.id} className="bg-white border rounded p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">
                              {coverage.period}: 
                              <select value={coverage.assignedSubstitute?.id || ''} onChange={(e) => handleReassignSub(coverage.id, e.target.value)}>
                                <option value=''>Unassigned</option>
                                {substitutes.filter(sub => {
                            // Exclude any sub who is absent on this date
                            const dateStr = new Date(absence.date).toISOString().split('T')[0];
                            return !absentTeacherIdsByDate[dateStr]?.has(sub.id);
                        }).sort((a, b) => {
                            const aLast = a.name.split(' ').slice(-1)[0].toLowerCase();
                            const bLast = b.name.split(' ').slice(-1)[0].toLowerCase();
                            return aLast.localeCompare(bLast);
                        }).map(sub => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                              </select>
                            </div>
                            <div className="text-sm text-gray-600">
                              Role: {isSubstitute ? 'Substitute' : (assignedPerson?.role || 'Teacher')} | 
                              Status: 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${coverage.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            coverage.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'}`}>
                                {coverage.status}
                              </span>
                            </div>
                            <div className="text-sm text-indigo-600 mt-1">
                              Algorithm Step: {coverage.algorithmStep || 'Auto-assigned'} - {getStepDescription(coverage.algorithmStep || 8)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {coverage.status !== 'confirmed' && (<>
                                <button onClick={() => {
                                const availableTeachers = getAvailableTeachers(coverage.period, absence.schoolId, absence.teacherId);
                                if (availableTeachers.length > 0) {
                                    const newTeacher = availableTeachers[0];
                                    handleReassign(coverage.id, newTeacher.id);
                                }
                                else {
                                    setError('No available teachers for reassignment.');
                                    setTimeout(() => setError(""), 3000);
                                }
                            }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" title="Reassign to different teacher">
                                  Modify
                                </button>
                                <button onClick={() => handleConfirmAssignment(coverage.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700" title="Confirm assignment">
                                  Confirm
                                </button>
                              </>)}
                            <button onClick={() => handleDeleteAssignment(coverage.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" title="Delete assignment">
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Substitute Attendance Tracking */}
                        {isSubstitute && coverage.assignedSubstitute && (<div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-3">Substitute Attendance:</div>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => handleSubstituteAttendance(absence.id, coverage.assignedSubstitute.id, 'full')} className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1" title="Present - Full Day">
                                <span>✅</span> Present - Full Day
                              </button>
                              <button onClick={() => handleSubstituteAttendance(absence.id, coverage.assignedSubstitute.id, 'absent')} className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center gap-1" title="Absent">
                                <span>❌</span> Absent
                              </button>
                              <button onClick={() => handleSubstituteAttendance(absence.id, coverage.assignedSubstitute.id, 'half_am')} className="bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 flex items-center gap-1" title="Half Day AM">
                                <span>🌅</span> Half Day AM
                              </button>
                              <button onClick={() => handleSubstituteAttendance(absence.id, coverage.assignedSubstitute.id, 'half_pm')} className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 flex items-center gap-1" title="Half Day PM">
                                <span>🌆</span> Half Day PM
                              </button>
                              <button onClick={() => {
                                setSelectedSubstitute({ absenceId: absence.id, substituteId: coverage.assignedSubstitute.id });
                                setCustomPeriods([]);
                                setShowCustomModal(true);
                            }} className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center gap-1" title="Custom Periods">
                                <span>⚙️</span> Custom
                              </button>
                            </div>
                          </div>)}
                        
                        {coverage.notes && (<div className="text-sm text-gray-600 mt-3">
                            <span className="font-medium">Notes:</span> {coverage.notes}
                          </div>)}
                      </div>);
                })}
                </div>) : (<div className="text-center py-4 text-gray-500">
                  No coverage assignments found for this absence.
                </div>)}
              <button onClick={() => handleConfirmAbsence(absence.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-2" title="Confirm absence">
                Confirm
              </button>
            </div>))}

          {success && (<div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
              {success}
            </div>)}
          {error && (<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
              {error}
            </div>)}
        </div>
      </div>

      {/* Custom Periods Modal */}
      {showCustomModal && selectedSubstitute && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Select Custom Periods</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Select the periods the substitute worked:</p>
              <div className="grid grid-cols-2 gap-2">
                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map((period) => (<label key={period} className="flex items-center space-x-2">
                    <input type="checkbox" checked={customPeriods.includes(period)} onChange={(e) => {
                    if (e.target.checked) {
                        setCustomPeriods([...customPeriods, period]);
                    }
                    else {
                        setCustomPeriods(customPeriods.filter(p => p !== period));
                    }
                }} className="rounded"/>
                    <span className="text-sm">{period}</span>
                  </label>))}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => {
                setShowCustomModal(false);
                setSelectedSubstitute(null);
                setCustomPeriods([]);
            }} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={() => {
                if (customPeriods.length > 0) {
                    handleSubstituteAttendance(selectedSubstitute.absenceId, selectedSubstitute.substituteId, 'custom', customPeriods);
                    setShowCustomModal(false);
                    setSelectedSubstitute(null);
                    setCustomPeriods([]);
                }
                else {
                    setError('Please select at least one period');
                    setTimeout(() => setError(""), 3000);
                }
            }} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Submit
              </button>
            </div>
          </div>
        </div>)}

      <div className="mt-8 w-full max-w-2xl bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Assignments</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Teacher</th>
              <th className="border px-2 py-1">Periods</th>
              <th className="border px-2 py-1">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, i) => (<tr key={i}>
                <td className="border px-2 py-1">{a.teacher}</td>
                <td className="border px-2 py-1">{Array.isArray(a.periods) ? a.periods.join(', ') : a.periods}</td>
                <td className="border px-2 py-1">{a.assigned}</td>
              </tr>))}
          </tbody>
        </table>
      </div>

      <button className={`px-6 py-2 rounded font-semibold text-white ${loading ? 'bg-gray-400' : 'bg-indigo-700 hover:bg-indigo-800'}`} onClick={handleAssignCoverage} disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Coverage'}
      </button>
    </div>);
}
