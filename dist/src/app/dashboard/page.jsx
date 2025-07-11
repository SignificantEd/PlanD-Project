"use client";
import { useState, useEffect } from 'react';
import MetricsTicker from '../../components/MetricsTicker';
import ScheduleImport from '../../components/ScheduleImport';
export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalAbsences: 0,
        pendingAssignments: 0,
        completedToday: 0,
        teachersAvailable: 0,
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [absencesRes, coverageRes] = await Promise.all([
                    fetch('/api/absences'),
                    fetch('/api/coverage'),
                ]);
                if (absencesRes.ok && coverageRes.ok) {
                    const absences = await absencesRes.json();
                    const coverage = await coverageRes.json();
                    const today = new Date().toISOString().split('T')[0];
                    const completedToday = coverage.filter((c) => c.status === 'confirmed' &&
                        new Date(c.confirmedAt).toISOString().split('T')[0] === today).length;
                    setStats({
                        totalAbsences: absences.length,
                        pendingAssignments: absences.filter((a) => a.status === 'pending').length,
                        completedToday,
                        teachersAvailable: 15, // Mock data - would come from schedule API
                    });
                }
            }
            catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <MetricsTicker />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/significant-logo.png" alt="Significant Consulting Logo" className="h-16 w-16 mx-auto mb-4"/>
            <h1 className="text-3xl font-bold text-indigo-800">PlanD Dashboard</h1>
            <p className="text-indigo-600 font-medium">Chaos is not Scheduled</p>
            <span className="text-xs text-gray-500">A Significant Consulting Product</span>
          </div>

          {/* Navigation */}
          <nav className="mb-8 flex justify-center space-x-6">
            <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
            <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
            <a href="/dashboard" className="text-indigo-700 font-semibold underline">Dashboard</a>
          </nav>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-2xl font-bold text-indigo-600">{loading ? '...' : stats.totalAbsences}</div>
              <div className="text-sm text-gray-600">Total Absences</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-2xl font-bold text-amber-600">{loading ? '...' : stats.pendingAssignments}</div>
              <div className="text-sm text-gray-600">Pending Assignments</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.completedToday}</div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.teachersAvailable}</div>
              <div className="text-sm text-gray-600">Teachers Available</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a href="/absences/new" className="block w-full bg-indigo-700 text-white font-semibold py-3 px-4 rounded hover:bg-indigo-800 transition text-center">
                  Report New Absence
                </a>
                <a href="/absences/assign" className="block w-full bg-green-700 text-white font-semibold py-3 px-4 rounded hover:bg-green-800 transition text-center">
                  Assign Coverage
                </a>
                <button className="block w-full bg-purple-700 text-white font-semibold py-3 px-4 rounded hover:bg-purple-800 transition">
                  View Reports
                </button>
              </div>
            </div>

            {/* Schedule Import */}
            <ScheduleImport />
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium">John Smith absence reported</div>
                  <div className="text-sm text-gray-600">Period 2, Period 7 - Today</div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Pending</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium">Sarah Jones coverage assigned</div>
                  <div className="text-sm text-gray-600">Emily Brown assigned to Period 3</div>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Assigned</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">Master schedule updated</div>
                  <div className="text-sm text-gray-600">47 new entries imported</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
