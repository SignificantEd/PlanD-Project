"use client"

import { useState, useEffect } from 'react';
import {
  ITeacher,
  ISubstitute,
  IAbsence,
  IAssignment,
  ISettings,
  IDashboardStats,
  IRecentActivity,
  INavigationItem
} from '../../types/interfaces';
import MetricsTicker from '../../components/MetricsTicker';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [stats, setStats] = useState<IDashboardStats>({
    teachersAbsent: 0,
    periodsToCover: 0,
    assignmentsMade: 0,
    timeSaved: 0,
    pendingApprovals: 0,
    totalSubstitutes: 0,
    totalTeachers: 0,
    coverageRate: 0,
    coveredPeriods: 0,
    totalPeriods: 0
  });
  const [recentActivity, setRecentActivity] = useState<IRecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningCoverage, setAssigningCoverage] = useState(false);

  // Navigation items for the enterprise system
  const navigationItems: INavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home', current: true },
    { name: 'Master Schedule', href: '/master-schedule', icon: 'calendar' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar' },
    { name: 'Absent Staff', href: '/absences', icon: 'user-group' },
    { name: 'Substitute Pool', href: '/substitutes', icon: 'academic-cap' },
    { name: 'Settings', href: '/settings', icon: 'cog' },
    { name: 'Coverage Results', href: '/coverage-results', icon: 'check-circle' },
    { name: 'Approval Queue', href: '/approval-queue', icon: 'document-text', badge: 0 },
    { name: 'Reports', href: '/reports', icon: 'chart-bar' },
    { name: 'History', href: '/history', icon: 'clock' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
      try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/recent-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }

      // Update approval queue badge
      const approvalResponse = await fetch('/api/admin/approval-queue');
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        const pendingCount = approvalData.filter((item: any) => 
          item.assignment.status === 'Pending Approval'
          ).length;

        const approvalItem = navigationItems.find(item => item.name === 'Approval Queue');
        if (approvalItem) {
          approvalItem.badge = pendingCount;
        }
      }

      } catch (error) {
      console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleAssignCoverage = async () => {
    try {
      setAssigningCoverage(true);
      
      const today = new Date().toISOString().split('T')[0];
      const dayType = getCurrentDayType(); // Helper function to determine A/B day
      
      const response = await fetch('/api/admin/assign-coverage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          dayType: dayType
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Coverage assignment completed:', result);
        
        // Refresh dashboard data
        await fetchDashboardData();
        
        // Show success message
        alert(`Coverage assignment completed! ${result.assignments.length} assignments made in ${result.processingTime}ms`);
      } else {
        throw new Error('Failed to assign coverage');
      }
    } catch (error) {
      console.error('Error assigning coverage:', error);
      alert('Error assigning coverage. Please try again.');
    } finally {
      setAssigningCoverage(false);
    }
  };

  const getCurrentDayType = (): 'A' | 'B' => {
    // Simple logic to determine A/B day - would be more sophisticated in production
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek % 2 === 0 ? 'A' : 'B';
  };

  const formatTimeSaved = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'home': CalendarIcon,
      'calendar': CalendarIcon,
      'user-group': UserGroupIcon,
      'academic-cap': AcademicCapIcon,
      'cog': CogIcon,
      'check-circle': CheckCircleIcon,
      'document-text': DocumentTextIcon,
      'chart-bar': ChartBarIcon,
      'clock': ClockIcon
    };
    return iconMap[iconName] || CalendarIcon;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <MetricsTicker />
      
          {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/significant-logo.png" 
                  alt="Significant Consulting Logo" 
                  className="h-12 w-12"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">PlanD Enterprise</h1>
                <p className="text-sm text-gray-600">Because Chaos Isn't on the Schedule</p>
          </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Day {getCurrentDayType()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = getIconComponent(item.icon || 'home');
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teachers Absent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.teachersAbsent}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Periods to Cover</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.periodsToCover}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assignments Made</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : stats.assignmentsMade}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Time Saved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '...' : formatTimeSaved(stats.timeSaved)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Rate and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coverage Rate */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Rate</h3>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - stats.coverageRate / 100)}`}
                        className="text-green-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : `${Math.round(stats.coverageRate)}%`}
                      </span>
                    </div>
            </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  {stats.coveredPeriods || 0} of {stats.totalPeriods || 0} periods covered
                </p>
          </div>

            {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAssignCoverage}
                    disabled={assigningCoverage}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigningCoverage ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        🚀 Assign Coverage
                      </div>
                    )}
                  </button>
                  
                <a 
                  href="/absences/new"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
                  >
                    <UserIcon className="h-5 w-5 mr-2" />
                    Report Absence
                </a>
                  
                <a 
                    href="/substitutes"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Manage Substitutes
                  </a>
                  
                  <a
                    href="/approval-queue"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-200"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Review Approvals
                    {stats.pendingApprovals > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-amber-600 bg-white rounded-full">
                        {stats.pendingApprovals}
                      </span>
                    )}
                  </a>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <a href="/history" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                  View All →
                </a>
          </div>

              <div className="space-y-4">
                {loading ? (
            <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'absence_reported' ? 'bg-red-400' :
                          activity.type === 'coverage_assigned' ? 'bg-green-400' :
                          activity.type === 'assignment_approved' ? 'bg-blue-400' :
                          activity.type === 'assignment_rejected' ? 'bg-amber-400' :
                          'bg-gray-400'
                        }`}></div>
                <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'absence_reported' ? 'bg-red-100 text-red-800' :
                        activity.type === 'coverage_assigned' ? 'bg-green-100 text-green-800' :
                        activity.type === 'assignment_approved' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'assignment_rejected' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Activity will appear here as you use the system.
                    </p>
                </div>
                )}
              </div>
                </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Total Teachers</h4>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalTeachers}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Available Substitutes</h4>
                <p className="text-2xl font-bold text-green-600">{stats.totalSubstitutes}</p>
                </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Pending Approvals</h4>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 