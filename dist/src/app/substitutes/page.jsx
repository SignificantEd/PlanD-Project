"use client";
import React from "react";
import { useState, useEffect } from "react";
import MetricsTicker from "../../components/MetricsTicker";
export default function SubstitutesPage() {
    const [substitutes, setSubstitutes] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('directory');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSubstitute, setEditingSubstitute] = useState(null);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    // Form state for add/edit
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subjectSpecialties: [],
        availability: {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        }
    });
    const subjectOptions = [
        'Math', 'Science', 'English', 'History', 'Foreign Languages',
        'Physical Education', 'Arts', 'Music', 'General'
    ];
    const periodOptions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const [subAvailState, setSubAvailState] = useState({});
    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        if (substitutes.length > 0) {
            const initialState = {};
            substitutes.forEach(sub => {
                const avail = typeof sub.availability === 'object' ? sub.availability : JSON.parse(sub.availability);
                const allPeriods = periodOptions;
                const allDays = dayOptions;
                let dropdown = 'full';
                const isFullDay = allDays.every(day => (avail[day] || []).length === allPeriods.length && allPeriods.every(p => avail[day]?.includes(p)));
                const isHalfDayAM = allDays.every(day => (avail[day] || []).length === 4 && ['1st', '2nd', '3rd', '4th'].every(p => avail[day]?.includes(p)));
                const isHalfDayPM = allDays.every(day => (avail[day] || []).length === 4 && ['5th', '6th', '7th', '8th'].every(p => avail[day]?.includes(p)));
                const isAbsent = allDays.every(day => (avail[day] || []).length === 0 || !avail[day]);
                if (isFullDay)
                    dropdown = 'full';
                else if (isHalfDayAM)
                    dropdown = 'am';
                else if (isHalfDayPM)
                    dropdown = 'pm';
                else if (isAbsent)
                    dropdown = 'absent';
                else
                    dropdown = 'custom';
                initialState[sub.id] = { dropdown, custom: avail };
            });
            setSubAvailState(initialState);
        }
    }, [substitutes]);
    const fetchData = async () => {
        try {
            const [subsRes, historyRes] = await Promise.all([
                fetch('/api/substitutes/all'),
                fetch('/api/substitutes/history')
            ]);
            if (subsRes.ok) {
                const subsData = await subsRes.json();
                setSubstitutes(subsData);
            }
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setAssignmentHistory(historyData);
            }
        }
        catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load substitute data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddSubstitute = async () => {
        try {
            const response = await fetch('/api/substitutes/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                setSuccess('Substitute added successfully!');
                setShowAddModal(false);
                resetForm();
                fetchData();
            }
            else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to add substitute');
            }
        }
        catch (error) {
            console.error('Error adding substitute:', error);
            setError('Error adding substitute');
        }
    };
    const handleEditSubstitute = async () => {
        if (!editingSubstitute)
            return;
        try {
            const response = await fetch(`/api/substitutes/${editingSubstitute.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                setSuccess('Substitute updated successfully!');
                setEditingSubstitute(null);
                resetForm();
                fetchData();
            }
            else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update substitute');
            }
        }
        catch (error) {
            console.error('Error updating substitute:', error);
            setError('Error updating substitute');
        }
    };
    const handleDeleteSubstitute = async (id) => {
        if (!confirm('Are you sure you want to delete this substitute?'))
            return;
        try {
            const response = await fetch(`/api/substitutes/manage?id=${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSuccess('Substitute deleted successfully!');
                fetchData();
            }
            else {
                setError('Failed to delete substitute');
            }
        }
        catch (error) {
            console.error('Error deleting substitute:', error);
            setError('Error deleting substitute');
        }
    };
    const handleSelectAllSubsAllPeriods = async () => {
        if (!confirm('This will set ALL substitutes to be available for ALL periods EVERY day. Are you sure?'))
            return;
        try {
            const response = await fetch('/api/substitutes/bulk-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'select-all-periods'
                }),
            });
            if (response.ok) {
                setSuccess('All substitutes are now available for all periods every day!');
                fetchData();
            }
            else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update substitute availability');
            }
        }
        catch (error) {
            console.error('Error updating substitute availability:', error);
            setError('Error updating substitute availability');
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            subjectSpecialties: [],
            availability: {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: []
            }
        });
    };
    const openEditModal = (substitute) => {
        setEditingSubstitute(substitute);
        setFormData({
            name: substitute.name,
            email: substitute.email,
            subjectSpecialties: Array.isArray(substitute.subjectSpecialties)
                ? substitute.subjectSpecialties
                : JSON.parse(substitute.subjectSpecialties),
            availability: typeof substitute.availability === 'object'
                ? substitute.availability
                : JSON.parse(substitute.availability)
        });
    };
    const getReliabilityScore = (substituteId) => {
        const assignments = assignmentHistory.filter(h => h.substituteId === substituteId);
        if (assignments.length === 0)
            return 'No assignments';
        const present = assignments.filter(a => a.status === 'full' || a.status === 'half_am' || a.status === 'half_pm' || a.status === 'custom').length;
        const absent = assignments.filter(a => a.status === 'absent').length;
        const total = assignments.length;
        const score = ((present / total) * 100).toFixed(1);
        return `${score}% (${present}/${total})`;
    };
    const getAvailabilityForDay = (substitute, day) => {
        const availability = typeof substitute.availability === 'object'
            ? substitute.availability
            : JSON.parse(substitute.availability);
        return availability[day] || [];
    };
    const handleDropdown = async (subId, val) => {
        setSubAvailState(prev => ({
            ...prev,
            [subId]: {
                ...prev[subId],
                dropdown: val,
                custom: val === 'custom' ? prev[subId]?.custom || {} : {},
            },
        }));
        let newAvail = {};
        if (val === 'full') {
            dayOptions.forEach(day => newAvail[day] = [...periodOptions]);
        }
        else if (val === 'am') {
            dayOptions.forEach(day => newAvail[day] = ['1st', '2nd', '3rd', '4th']);
        }
        else if (val === 'pm') {
            dayOptions.forEach(day => newAvail[day] = ['5th', '6th', '7th', '8th']);
        }
        else if (val === 'absent') {
            newAvail = {};
        }
        // Only update backend and fetchData if not custom
        if (val !== 'custom') {
            const sub = substitutes.find(s => s.id === subId);
            if (!sub)
                return;
            await fetch('/api/substitutes/manage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: sub.id,
                    name: sub.name,
                    email: sub.email,
                    subjectSpecialties: sub.subjectSpecialties,
                    availability: newAvail,
                }),
            });
            fetchData();
        }
    };
    const handleCustomPeriodCheck = async (subId, period) => {
        // Update local state immediately
        setSubAvailState(prev => {
            const prevCustom = prev[subId]?.custom || {};
            const updated = { ...prevCustom };
            if (!updated['ALL'])
                updated['ALL'] = [];
            if (updated['ALL'].includes(period)) {
                updated['ALL'] = updated['ALL'].filter((p) => p !== period);
            }
            else {
                updated['ALL'] = [...updated['ALL'], period];
            }
            return {
                ...prev,
                [subId]: {
                    ...prev[subId],
                    dropdown: 'custom',
                    custom: updated,
                },
            };
        });
        // Fetch the full substitute object
        const sub = substitutes.find(s => s.id === subId);
        if (!sub)
            return;
        // Set the same periods for all days
        const newAvail = {};
        const customPeriods = subAvailState[subId]?.custom['ALL'] || [];
        // Use the updated periods for the backend call
        const nextPeriods = customPeriods.includes(period)
            ? customPeriods.filter((p) => p !== period)
            : [...customPeriods, period];
        dayOptions.forEach(day => newAvail[day] = nextPeriods);
        await fetch('/api/substitutes/manage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: sub.id,
                name: sub.name,
                email: sub.email,
                subjectSpecialties: sub.subjectSpecialties,
                availability: newAvail,
            }),
        });
        fetchData();
    };
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
    }
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      <div className="flex flex-col items-center py-8 px-4">
        <div className="flex flex-col items-center mb-8">
          <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mb-2"/>
          <h1 className="text-3xl font-bold text-indigo-800">PlanD Substitute Management</h1>
          <p className="text-indigo-600 font-medium">Chaos is not Scheduled</p>
          <span className="text-xs text-gray-500 mt-1">A Significant Consulting Product</span>
        </div>
        
        <nav className="mb-8 flex space-x-6">
          <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
          <a href="/substitutes" className="text-indigo-700 font-semibold underline">Substitutes</a>
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>

        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800">Substitute Management</h2>
            <div className="flex space-x-3">
              <button onClick={() => {
            resetForm();
            setShowAddModal(true);
            setEditingSubstitute(null);
        }} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Add Substitute
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b">
            {[
            { id: 'directory', label: 'Directory' },
            { id: 'availability', label: 'Availability Grid' },
            { id: 'history', label: 'Assignment History' },
            { id: 'reliability', label: 'Reliability Tracking' }
        ].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {tab.label}
              </button>))}
          </div>

          {/* Directory Tab */}
          {activeTab === 'directory' && (<div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Email</th>
                    <th className="border border-gray-300 px-4 py-2">Specialties</th>
                    <th className="border border-gray-300 px-4 py-2">Availability</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutes.map((sub) => {
                const subState = subAvailState[sub.id] || { dropdown: 'full', custom: {} };
                return (<tr key={sub.id} className={subState.dropdown === 'absent' ? 'opacity-50 bg-gray-100' : ''}>
                        <td className="border border-gray-300 px-4 py-2">{sub.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{sub.email}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {(Array.isArray(sub.subjectSpecialties) ? sub.subjectSpecialties : JSON.parse(sub.subjectSpecialties)).join(', ')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <select value={subState.dropdown} onChange={(e) => handleDropdown(sub.id, e.target.value)} className="border rounded px-2 py-1">
                            <option value="full">Full Day</option>
                            <option value="am">Half Day AM</option>
                            <option value="pm">Half Day PM</option>
                            <option value="custom">Custom</option>
                            <option value="absent">Absent</option>
                          </select>
                          {subState.dropdown === 'custom' && (<div className="mt-2 flex flex-wrap gap-2">
                              {periodOptions.map((period) => (<label key={period} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" checked={subState.custom['ALL']?.includes(period) || false} onChange={() => handleCustomPeriodCheck(sub.id, period)} disabled={subState.dropdown === 'absent'}/>
                                  <span>{period}</span>
                                </label>))}
                            </div>)}
                          {subState.dropdown === 'absent' && (<div className="text-xs text-red-600 mt-2">This substitute is marked absent for all periods.</div>)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button onClick={() => openEditModal(sub)} className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 mr-2">Edit</button>
                          <button onClick={() => handleDeleteSubstitute(sub.id)} className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700">Delete</button>
                        </td>
                      </tr>);
            })}
                </tbody>
              </table>
            </div>)}

          {/* Availability Grid Tab */}
          {activeTab === 'availability' && (<div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Substitute</th>
                    {dayOptions.map(day => (<th key={day} className="border border-gray-300 px-4 py-2">{day}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {substitutes.map(substitute => (<tr key={substitute.id}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {substitute.name}
                      </td>
                      {dayOptions.map(day => (<td key={day} className="border border-gray-300 px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {getAvailabilityForDay(substitute, day).map(period => (<span key={period} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                {period}
                              </span>))}
                          </div>
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>)}

          {/* Assignment History Tab */}
          {activeTab === 'history' && (<div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">Date</th>
                      <th className="border border-gray-300 px-4 py-2">Substitute</th>
                      <th className="border border-gray-300 px-4 py-2">Teacher Absent</th>
                      <th className="border border-gray-300 px-4 py-2">Status</th>
                      <th className="border border-gray-300 px-4 py-2">Periods Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentHistory.map(assignment => (<tr key={assignment.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(assignment.date).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {substitutes.find(s => s.id === assignment.substituteId)?.name || 'Unknown'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {assignment.absence.teacher.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${assignment.status === 'full' ? 'bg-green-100 text-green-800' :
                    assignment.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                                                  {Array.isArray(assignment.periodsWorked)
                    ? assignment.periodsWorked.join(', ')
                    : 'N/A'}
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>)}

          {/* Reliability Tracking Tab */}
          {activeTab === 'reliability' && (<div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {substitutes.map(substitute => {
                const assignments = assignmentHistory.filter(h => h.substituteId === substitute.id);
                const totalAssignments = assignments.length;
                const presentAssignments = assignments.filter(a => a.status === 'full' || a.status === 'half_am' || a.status === 'half_pm' || a.status === 'custom').length;
                const absentAssignments = assignments.filter(a => a.status === 'absent').length;
                const reliabilityScore = totalAssignments > 0 ? ((presentAssignments / totalAssignments) * 100).toFixed(1) : '0';
                return (<div key={substitute.id} className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-lg mb-3">{substitute.name}</h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Assignments:</span>
                          <span className="font-medium">{totalAssignments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Present:</span>
                          <span className="font-medium text-green-600">{presentAssignments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent:</span>
                          <span className="font-medium text-red-600">{absentAssignments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Reliability Score:</span>
                          <span className={`font-medium ${parseFloat(reliabilityScore) >= 90 ? 'text-green-600' :
                        parseFloat(reliabilityScore) >= 75 ? 'text-yellow-600' :
                            'text-red-600'}`}>
                            {reliabilityScore}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${parseFloat(reliabilityScore) >= 90 ? 'bg-green-500' :
                        parseFloat(reliabilityScore) >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'}`} style={{ width: `${reliabilityScore}%` }}></div>
                        </div>
                      </div>
                    </div>);
            })}
              </div>
            </div>)}

          {success && (<div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
              {success}
            </div>)}
          {error && (<div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
              {error}
            </div>)}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingSubstitute) && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingSubstitute ? 'Edit Substitute' : 'Add New Substitute'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Substitute name"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="substitute@email.com"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Specialties</label>
                <div className="grid grid-cols-3 gap-2">
                  {subjectOptions.map(subject => (<label key={subject} className="flex items-center space-x-2">
                      <input type="checkbox" checked={formData.subjectSpecialties.includes(subject)} onChange={(e) => {
                    if (e.target.checked) {
                        setFormData({
                            ...formData,
                            subjectSpecialties: [...formData.subjectSpecialties, subject]
                        });
                    }
                    else {
                        setFormData({
                            ...formData,
                            subjectSpecialties: formData.subjectSpecialties.filter(s => s !== subject)
                        });
                    }
                }} className="rounded"/>
                      <span className="text-sm">{subject}</span>
                    </label>))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <div className="space-y-3">
                  {dayOptions.map(day => (<div key={day}>
                      <h4 className="font-medium text-sm mb-2">{day}</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {periodOptions.map((period) => (<label key={period} className="flex items-center space-x-2">
                            <input type="checkbox" checked={formData.availability[day].includes(period)} onChange={(e) => {
                        const currentPeriods = formData.availability[day];
                        if (e.target.checked) {
                            setFormData({
                                ...formData,
                                availability: {
                                    ...formData.availability,
                                    [day]: [...currentPeriods, period]
                                }
                            });
                        }
                        else {
                            setFormData({
                                ...formData,
                                availability: {
                                    ...formData.availability,
                                    [day]: currentPeriods.filter(p => p !== period)
                                }
                            });
                        }
                    }} className="rounded"/>
                            <span className="text-sm">{period}</span>
                          </label>))}
                      </div>
                    </div>))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => {
                setShowAddModal(false);
                setEditingSubstitute(null);
                resetForm();
            }} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={editingSubstitute ? handleEditSubstitute : handleAddSubstitute} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                {editingSubstitute ? 'Update' : 'Add'} Substitute
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
