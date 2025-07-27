"use client";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react';

// Utility: Get salutation (default Ms., or use t.salutation if present)
function getSalutation(t: { salutation?: string }): string {
  if (t.salutation) return t.salutation;
  return 'Ms.';
}

// Utility: Format teacher display name with first initial
function getDisplayName(t: { name?: string; salutation?: string }): string {
  if (!t || !t.name) return '';
  const names = t.name.trim().split(' ');
  const firstInitial = names[0] ? names[0][0].toUpperCase() + '.' : '';
  const lastName = names.length > 1 ? names[names.length - 1] : names[0];
  return `${firstInitial} ${lastName}`;
}

export default function CoverageAssignmentPage() {
  const [absences, setAbsences] = useState<Array<{
    id: string;
    teacherId: string;
    date: string;
    absenceType: string;
    status: string;
    notes?: string;
    periods?: string[];
    teacher?: { name: string; department?: string; role?: string };
    coverageAssignments?: Array<{
      id: string;
      [key: string]: string | undefined;
    }>;
  }>>([]); 
  const [assignmentResults, setAssignmentResults] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvingAll, setApprovingAll] = useState(false);
  const [approvingIndividual, setApprovingIndividual] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Array<{
    id: string;
    name: string;
    department?: string;
    role?: string;
  }>>([]);
  const [masterSchedules, setMasterSchedules] = useState<Array<{
    id: string;
    teacherId: string;
    schedule: Record<string, string>;
    dayOfWeek?: string;
    period?: string;
    isTeaching?: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customPeriods, setCustomPeriods] = useState<string[]>([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<{absenceId: string, substituteId: string} | null>(null);
  const [assignments, setAssignments] = useState<Array<any>>([]);
  const [substitutes, setSubstitutes] = useState<Array<{
    id: string;
    name: string;
    email: string;
    preferredTeacherId?: string;
  }>>([]);
  const [absentTeacherIdsByDate, setAbsentTeacherIdsByDate] = useState<Record<string, Set<string>>>({});
  const [existingAttendance, setExistingAttendance] = useState<{
    id: string;
    absenceId: string;
    substituteId: string;
    attendanceType: string;
    periodsWorked?: string[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [absencesRes, teachersRes, masterScheduleRes, substitutesRes] = await Promise.all([
        fetch('/api/absences'),
        fetch('/api/teachers'),
        fetch('/api/master-schedule'),
        fetch('/api/substitutes/all')
      ]);
      
      if (absencesRes.ok) {
        const absencesData = await absencesRes.json();
        
        // For each absence, fetch its coverage assignments
        const absencesWithCoverage = await Promise.all(absencesData.map(async (absence: any) => {
          try {
            const coverageRes = await fetch(`/api/coverage?absenceId=${absence.id}`);
            if (coverageRes.ok) {
              const coverageData = await coverageRes.json();
              // Extract the assignments array from the response
              return { ...absence, coverageAssignments: coverageData.assignments || [] };
            }
          } catch (error) {
            console.error('Error fetching coverage for absence:', absence.id, error);
          }
          return absence;
        }));
        
        setAbsences(absencesWithCoverage);
        
        // Build a map of absent teacher IDs by date
        const map: Record<string, Set<string>> = {};
        absencesWithCoverage.forEach((a: any) => {
          const dateStr = new Date(a.date).toISOString().split('T')[0];
          if (!map[dateStr]) map[dateStr] = new Set();
          map[dateStr].add(a.teacherId);
        });
        setAbsentTeacherIdsByDate(map);
      }
      
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
      }
      
      if (masterScheduleRes.ok) {
        const masterScheduleData = await masterScheduleRes.json();
        setMasterSchedules(masterScheduleData);
      }
      
      if (substitutesRes.ok) {
        const substitutesData = await substitutesRes.json();
        setSubstitutes(substitutesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAbsences = async () => {
    try {
      const response = await fetch('/api/absences');
      const data = await response.json();
      setAbsences(data);
    } catch (error) {
      console.error('Failed to fetch absences:', error);
    }
  };

  const runAssignment = async (date: string) => {
    setLoading(true);
    setError('');
    setAssignmentResults([]);  // Change from null to empty array
    
    try {
      const response = await fetch('/api/admin/assign-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, dayType: 'A' }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAssignmentResults(result);
        await fetchData(); // Refresh data
        setSuccess('Coverage assigned successfully!');
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError('Failed to assign coverage.');
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error assigning coverage:', error);
      setError('Error assigning coverage.');
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteAssignment = async (coverageId: string) => {
    if (confirm('Are you sure you want to delete this coverage assignment?')) {
      try {
        const response = await fetch(`/api/coverage?id=${coverageId}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData(); // Refresh data
          setSuccess('Coverage assignment deleted successfully!');
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError('Failed to delete coverage assignment.');
          setTimeout(() => setError(""), 3000);
        }
      } catch (error) {
        console.error('Error deleting coverage assignment:', error);
        setError('Error deleting coverage assignment.');
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleConfirmAssignment = async (coverageId: string) => {
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
      } else {
        setError('Failed to confirm coverage assignment.');
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error confirming coverage assignment:', error);
      setError('Error confirming coverage assignment.');
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSubstituteAttendance = async (absenceId: string, substituteId: string, attendanceType: string, periodsWorked?: string[]) => {
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
        } else {
          setSuccess('Substitute attendance recorded successfully!');
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to record substitute attendance');
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error recording substitute attendance:', error);
      setError('Error recording substitute attendance');
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStepDescription = (step: number) => {
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
    return steps[step as keyof typeof steps] || "Unknown Step";
  };

  const getAvailableTeachers = (period: string, schoolId: string, excludeTeacherId: string) => {
    return teachers.filter((t: any) => {
      if (t.id === excludeTeacherId) return false;
      const schedule = masterSchedules.filter((ms: any) => 
        ms.teacherId === t.id && 
        ms.period === period && 
        ms.schoolId === schoolId
      );
      return schedule.length > 0 && schedule.every((ms: any) => ms.isTeaching === false);
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
      } else {
        setAssignments(data.assignments || []);
        setSuccess('Coverage assigned!');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date as MM-DD-YYYY
  function formatDateYYYYMMDD(dateStr: string) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // New handler for proprietary algorithm
  const handleAssignCoverageProprietary = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setAssignments([]);
    try {
      // Use the date from the first absence, or today's date if none
      const rawDate = absences.length > 0 ? absences[0].date : new Date().toISOString().split('T')[0];
      const date = formatDateYYYYMMDD(rawDate);
      const dayType = 'A'; // Default to 'A' unless you have a way to determine this
      
      // Check if there are absences for this date
      const absencesForDate = absences.filter(a => a.date === rawDate);
      if (absencesForDate.length === 0) {
        setError(`No absences found for date ${date}. Please report an absence first.`);
        return;
      }
      
      // Debug logging
      console.log('Assign Coverage Debug:', {
        absencesCount: absences.length,
        absencesForDateCount: absencesForDate.length,
        rawDate,
        formattedDate: date,
        dayType,
        firstAbsence: absences.length > 0 ? absences[0] : null,
        absencesForDate: absencesForDate
      });
      
      const res = await fetch('/api/admin/assign-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, dayType })
      });
      
      // Debug response
      console.log('API Response Status:', res.status);
      const data = await res.json();
      console.log('API Response Data:', data);
      if (Array.isArray(data.assignments)) {
        console.log('Assignments array from API:', data.assignments);
      } else {
        console.log('No assignments array in API response.');
      }
      
      if (!res.ok) {
        setError(data.error || 'Failed to assign coverage');
      } else {
        setAssignments(data.assignments || []);
        
        // Fetch updated absences with coverage assignments
        await fetchData();
        setSuccess('Coverage assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning coverage:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a handler to update the assigned substitute
  const handleReassignSub = async (coverageId: string, newSubId: string) => {
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
      } else {
        setError('Failed to reassign substitute.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Error reassigning substitute.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Function to fetch existing substitute attendance
  const fetchExistingAttendance = async (absenceId: string, substituteId: string) => {
    try {
      const response = await fetch(`/api/substitutes?absenceId=${absenceId}&substituteId=${substituteId}`);
      if (response.ok) {
        const attendance = await response.json();
        return attendance;
      }
      return null;
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
      return null;
    }
  };

  // Function to open custom modal with existing data
  const openCustomModal = async (absenceId: string, substituteId: string) => {
    setSelectedSubstitute({absenceId, substituteId});
    
    // Try to fetch existing attendance
    const existing = await fetchExistingAttendance(absenceId, substituteId);
    setExistingAttendance(existing);
    
    if (existing && existing.periodsWorked) {
      setCustomPeriods(existing.periodsWorked);
    } else {
      setCustomPeriods([]);
    }
    
    setShowCustomModal(true);
  };

  const getTeachingPeriodsForAbsence = (absence: any) => {
    const date = new Date(absence.date);
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
    const periods = masterSchedules
      .filter(ms => ms.teacherId === absence.teacherId && (ms.dayOfWeek === null || ms.dayOfWeek === dayOfWeek) && ms.isTeaching)
      .map(ms => ms.period);
    
    // Remove duplicates and sort
    return [...new Set(periods)].sort();
  };

  // Handle confirming individual absence
  const handleConfirmAbsence = async (absenceId: string) => {
    setApprovingIndividual(absenceId);
    try {
      const response = await fetch('/api/admin/approve-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ absenceId, action: 'approve' })
      });
      
      if (response.ok) {
        setSuccess('Coverage assignment confirmed successfully!');
        await fetchData(); // Refresh the data
      } else {
        setError('Failed to confirm coverage assignment');
      }
    } catch (error) {
      console.error('Error confirming assignment:', error);
      setError('Error confirming coverage assignment');
    } finally {
      setApprovingIndividual(null);
    }
  };

  // Handle confirming individual period assignment
  const handleConfirmPeriodAssignment = async (absenceId: string, period: string) => {
    const approvalKey = `${absenceId}-${period}`;
    setApprovingIndividual(approvalKey);
    try {
      const response = await fetch('/api/admin/approve-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ absenceId, period, action: 'approve_period' })
      });
      
      if (response.ok) {
        setSuccess(`Period ${period} coverage confirmed successfully!`);
        await fetchData(); // Refresh the data
      } else {
        setError(`Failed to confirm Period ${period} coverage`);
      }
    } catch (error) {
      console.error('Error confirming period assignment:', error);
      setError(`Error confirming Period ${period} coverage`);
    } finally {
      setApprovingIndividual(null);
    }
  };

  // Handle editing coverage for an absence
  const handleEditCoverage = (absenceId: string) => {
    // For now, show an alert with edit options
    // In a full implementation, this could open a modal or navigate to an edit page
    const absence = absences.find(a => a.id === absenceId);
    if (absence) {
      const teacher = absence.teacher || teachers.find((t: any) => t.id === absence.teacherId);
      const teacherName = teacher?.name || 'Unknown Teacher';
      const options = [
        'Reassign substitute',
        'Change coverage type', 
        'Add manual override',
        'Remove coverage',
        'Cancel'
      ];
      
      const choice = prompt(
        `Edit coverage for ${teacherName}:\n\n` +
        options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n') +
        '\n\nEnter your choice (1-5):'
      );
      
      switch (choice) {
        case '1':
          setSuccess('Reassign substitute functionality would open here');
          break;
        case '2':
          setSuccess('Change coverage type functionality would open here');
          break;
        case '3':
          setSuccess('Manual override functionality would open here');
          break;
        case '4':
          if (confirm('Are you sure you want to remove all coverage for this absence?')) {
            // Call API to remove coverage
            setSuccess('Coverage removal functionality would execute here');
          }
          break;
        default:
          // Cancel or invalid choice
          break;
      }
    }
  };

  // Handle confirming all pending absences
  const handleConfirmAll = async () => {
    const pendingAbsences = absences.filter(absence => 
      Array.isArray(absence.coverageAssignments) && 
      absence.coverageAssignments.some((assignment: any) => assignment.status === 'assigned')
    );
    
    if (pendingAbsences.length === 0) {
      setError('No pending assignments to confirm');
      return;
    }

    if (!confirm(`Are you sure you want to confirm ALL ${pendingAbsences.length} pending coverage assignments?`)) {
      return;
    }

    setApprovingAll(true);
    try {
      const response = await fetch('/api/admin/approve-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all', date: selectedDate })
      });
      
      if (response.ok) {
        setSuccess(`Successfully confirmed ${pendingAbsences.length} coverage assignments!`);
        await fetchData(); // Refresh the data
      } else {
        setError('Failed to confirm all coverage assignments');
      }
    } catch (error) {
      console.error('Error confirming all assignments:', error);
      setError('Error confirming all coverage assignments');
    } finally {
      setApprovingAll(false);
    }
  };

  // Calculate summary stats
  const uniqueTeacherIds = new Set(absences.map(a => a.teacherId));
  let totalPeriods = 0;
  absences.forEach(absence => {
    let periods = [];
    if (Array.isArray(absence.periods)) {
      periods = absence.periods;
    } else if (typeof absence.periods === 'string') {
      try {
        const parsed = JSON.parse(absence.periods);
        if (Array.isArray(parsed)) periods = parsed;
      } catch {}
    }
    if (Array.isArray(periods)) {
      totalPeriods += periods.length;
    }
  });
  
  // Group absences by date
  const absencesByDate = absences.reduce((acc, absence) => {
    const date = new Date(absence.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(absence);
    return acc;
  }, {} as Record<string, typeof absences>);
  
  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Add a function to get the true periods needing coverage for all absences
  // Function to get periods needing coverage for an absence (non-free periods only)
  const getPeriodsNeedingCoverage = (absence: any) => {
    // First try to get periods from absence record
    let periods: string[] = [];
    if (Array.isArray(absence.periods)) {
      periods = absence.periods;
    } else if (typeof absence.periods === 'string') {
      try {
        const parsed = JSON.parse(absence.periods);
        if (Array.isArray(parsed)) periods = parsed;
      } catch {}
    }
    
    // If no periods in absence record, determine them from absence type and master schedule
    if (!periods || periods.length === 0) {
      const dateObj = new Date(absence.date);
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
      
      const teachingPeriods = masterSchedules
        .filter(ms => ms.teacherId === absence.teacherId && (ms.dayOfWeek === null || ms.dayOfWeek === dayOfWeek) && ms.isTeaching)
        .map(ms => String(ms.period));
      
      // Remove duplicates using Set
      const uniquePeriods = [...new Set(teachingPeriods)].sort();
      
      // Filter based on absence type
      if (absence.absenceType === 'Half Day AM') {
        periods = uniquePeriods.filter(p => {
          const num = parseInt((p.match(/\d+/) || [''])[0], 10);
          return num >= 1 && num <= 4;
        });
      } else if (absence.absenceType === 'Half Day PM') {
        periods = uniquePeriods.filter(p => {
          const num = parseInt((p.match(/\d+/) || [''])[0], 10);
          return num >= 5 && num <= 8;
        });
      } else {
        periods = uniquePeriods; // Full day or other
      }
    }
    
    return periods || [];
  };

  // Function to sort absences by priority
  const sortAbsencesByPriority = (absences: any[]) => {
    return [...absences].sort((a, b) => {
      // Get teacher info for role comparison
      const teacherA = a.teacher || teachers.find((t: any) => t.id === a.teacherId) || {};
      const teacherB = b.teacher || teachers.find((t: any) => t.id === b.teacherId) || {};
      
      // Priority 1: Paraprofessionals first
      if (teacherA.role === 'paraprofessional' && teacherB.role !== 'paraprofessional') return -1;
      if (teacherA.role !== 'paraprofessional' && teacherB.role === 'paraprofessional') return 1;
      
      // Priority 2: Full Day absences
      if (a.absenceType === 'Full Day' && b.absenceType !== 'Full Day') return -1;
      if (a.absenceType !== 'Full Day' && b.absenceType === 'Full Day') return 1;
      
      // Priority 3: Half Day AM/PM
      if (a.absenceType === 'Half Day AM' && b.absenceType === 'Half Day PM') return -1;
      if (a.absenceType === 'Half Day PM' && b.absenceType === 'Half Day AM') return 1;
      
      // Priority 4: Custom absences
      if (a.absenceType === 'Custom' && b.absenceType !== 'Custom') return 1;
      if (a.absenceType !== 'Custom' && b.absenceType === 'Custom') return -1;
      
      // If same priority, sort by date (earliest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const getTotalTeachingPeriodsNeedingCoverage = () => {
    let total = 0;
    absences.forEach(absence => {
      total += getPeriodsNeedingCoverage(absence).length;
    });
    return total;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Assign Coverage</h1>
      
      {/* Navigation Menu */}
      <nav className="mb-6 flex space-x-6 border-b pb-4">
        <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
        <a href="/absences/assign" className="text-indigo-700 font-semibold underline">Assign Coverage</a>
        <a href="/substitutes" className="text-indigo-700 font-semibold hover:underline">Substitutes</a>
        <a href="/master-schedule" className="text-indigo-700 font-semibold hover:underline">Master Schedule</a>
        <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
        <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
      </nav>
      
      {/* Action Buttons */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleAssignCoverageProprietary}
            disabled={loading || absences.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Assigning...' : 'Assign Coverage (PlanD)'}
          </Button>
          <Button
            onClick={handleConfirmAll}
            disabled={approvingAll || absences.filter(a => Array.isArray(a.coverageAssignments) && a.coverageAssignments.some((assignment: any) => assignment.status === 'assigned')).length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {approvingAll ? 'Confirming All...' : 'Confirm All Coverage'}
          </Button>
          <Button
            onClick={async () => {
              if (confirm('Are you sure you want to clear ALL absences? This cannot be undone.')) {
                try {
                  const response = await fetch('/api/admin/clear-absences', { method: 'POST' });
                  if (response.ok) {
                    await fetchData();
                    setSuccess('All absences cleared successfully!');
                    setTimeout(() => setSuccess(''), 3000);
                  } else {
                    setError('Failed to clear absences');
                    setTimeout(() => setError(''), 3000);
                  }
                } catch (error) {
                  setError('Error clearing absences');
                  setTimeout(() => setError(''), 3000);
                }
              }
            }}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            Clear All Absences
          </Button>
        </div>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          <CheckCircle className="inline w-4 h-4 mr-2" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <AlertCircle className="inline w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Absences</h3>
          <p className="text-2xl font-bold">{absences.length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Teachers Absent</h3>
          <p className="text-2xl font-bold">{uniqueTeacherIds.size}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Periods to Cover</h3>
          <p className="text-2xl font-bold">{getTotalTeachingPeriodsNeedingCoverage()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Assignments Made</h3>
          <p className="text-2xl font-bold text-green-600">
            {absences.reduce((total, abs) => total + (abs.coverageAssignments?.length || 0), 0)}
          </p>
        </Card>
      </div>

      {/* Absences by Date */}
      <div className="space-y-6">
        {Object.keys(absencesByDate).length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No absences found</p>
          </Card>
        ) : (
          Object.entries(absencesByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateAbsences]: [string, any]) => (
              <Card key={date} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {sortAbsencesByPriority(dateAbsences).map((absence: any) => {
                    const teacher = absence.teacher || teachers.find((t: any) => t.id === absence.teacherId) || {};
                    const isPara = teacher.role === 'paraprofessional';
                    const priority = isPara ? 'Highest' : 
                                   absence.absenceType === 'Full Day' ? 'High' :
                                   absence.absenceType.includes('Half Day') ? 'Medium' : 'Low';
                    
                    return (
                      <div key={absence.id} className={`border rounded-lg p-3 ${isPara ? 'border-purple-300 bg-purple-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{teacher.name || 'Unknown Teacher'}</span>
                              {isPara && <Badge className="bg-purple-600 text-white">Paraprofessional</Badge>}
                              <Badge className={
                                priority === 'Highest' ? 'bg-red-600 text-white' :
                                priority === 'High' ? 'bg-orange-600 text-white' :
                                priority === 'Medium' ? 'bg-yellow-600 text-white' :
                                'bg-gray-600 text-white'
                              }>
                                {priority} Priority
                              </Badge>
                              {getStatusBadge(absence.status)}
                            </div>
                            <p className="text-sm text-gray-600">
                              Type: {absence.absenceType} | 
                              Department: {teacher.department || 'N/A'} |
                              Periods: {absence.periods?.join(', ') || 'All day'}
                            </p>
                            {absence.notes && (
                              <p className="text-sm text-gray-500 mt-1">Notes: {absence.notes}</p>
                            )}
                          </div>
                          
                          {/* Individual Confirm and Edit Buttons */}
                          {Array.isArray(absence.coverageAssignments) && absence.coverageAssignments.length > 0 && (
                            <div className="flex gap-2 ml-4">
                              {absence.coverageAssignments.some((assignment: any) => assignment.status === 'assigned') && (
                                <Button
                                  onClick={() => handleConfirmAbsence(absence.id)}
                                  disabled={approvingIndividual === absence.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  {approvingIndividual === absence.id ? 'Confirming...' : 'Confirm Coverage'}
                                </Button>
                              )}
                              <Button
                                onClick={() => handleEditCoverage(absence.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Show assignments if any */}
                        {Array.isArray(absence.coverageAssignments) && absence.coverageAssignments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2 text-green-700">✓ Coverage Assigned:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {absence.coverageAssignments.map((assignment: any, idx: number) => {
                                // Get the covering person's name and type
                                const coveringPerson = assignment.assigned || 'Unassigned';
                                const assignmentType = assignment.type || 'Coverage';
                                const period = assignment.period || `${idx + 1}`;
                                const isConfirmed = assignment.status === 'confirmed' || assignment.status === 'approved';
                                
                                return (
                                  <div key={idx} className="bg-green-50 rounded p-2 text-sm">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium">Period {period}:</span>
                                        <span className="ml-2 text-green-800 font-semibold">{coveringPerson}</span>
                                        <span className="text-xs text-gray-600 block">({assignmentType})</span>
                                      </div>
                                      {isConfirmed && (
                                        <span className="text-xs text-green-600 font-medium">✓</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Show if no assignments */}
                        {(!Array.isArray(absence.coverageAssignments) || absence.coverageAssignments.length === 0) && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-500">⏳ Coverage not yet assigned</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}