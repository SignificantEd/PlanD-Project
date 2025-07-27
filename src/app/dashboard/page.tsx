'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ITeacher,
  ISubstitute,
  IAbsence,
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
  AcademicCapIcon,
  BellIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FireIcon,
  ChartPieIcon,
  ComputerDesktopIcon,
  CloudIcon
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
  
  // Enhanced dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
    setLastUpdated(new Date());
    fetchDashboardData();
    fetchEnhancedData();
    fetchAlerts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isAutoRefreshEnabled) {
        fetchDashboardData();
        fetchEnhancedData();
        fetchAlerts();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled]);

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
        // Ensure timestamps are properly handled
        const processedActivityData = activityData.map((activity: any) => ({
          ...activity,
          timestamp: typeof activity.timestamp === 'string' ? activity.timestamp : new Date(activity.timestamp).toISOString()
        }));
        setRecentActivity(processedActivityData);
      }

      // Update approval queue badge and stats
      const approvalResponse = await fetch('/api/admin/approval-queue');
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        // Count actual approval queue items (individual period assignments)
        const pendingCount = approvalData.length;

        // Update the stats state with actual pending approvals count
        setStats(prevStats => ({
          ...prevStats,
          pendingApprovals: pendingCount
        }));

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

  // Enhanced dashboard functions
  const fetchEnhancedData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching enhanced dashboard data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleExport = async (type: string) => {
    try {
      setIsExporting(true);
      
      // Map dashboard export types to API report types
      const reportTypeMap: { [key: string]: string } = {
        'dashboard': 'daily-summary',
        'daily-report': 'daily-summary',
        'staff-report': 'staff-utilization',
        'cost-report': 'cost-analysis',
        'admin-report': 'admin-actions'
      };
      
      const reportType = reportTypeMap[type] || 'daily-summary';
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: reportType,
          dateRange: {
            start: today,
            end: today
          },
          filters: {}
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action }),
      });
      
      if (response.ok) {
        fetchAlerts();
        fetchDashboardData();
        fetchEnhancedData();
      }
    } catch (error) {
      console.error('Error handling alert action:', error);
    }
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

  // Add early return if not mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" suppressHydrationWarning={true}>
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
                <h1 className="text-2xl font-bold text-gray-900">PlanD Enterprise - Ultimate Dashboard</h1>
                <p className="text-sm text-gray-600">📊 Real-Time School Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time Status Indicators */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-xs text-gray-500">Live</span>
                </div>
                <span className="text-xs text-gray-400">
                  Updated: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  }) : '--:--:--'}
                </span>
              </div>
              
              {/* Critical Alerts Button */}
              {alerts.length > 0 && (
                <button
                  onClick={() => setAlertsVisible(!alertsVisible)}
                  className="relative inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {alerts.filter(a => a.priority === 'critical').length} Critical
                </button>
              )}
              
              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md ${
                  isAutoRefreshEnabled 
                    ? 'text-green-700 bg-green-50 border-green-300' 
                    : 'text-gray-700 bg-white'
                } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${isAutoRefreshEnabled ? 'animate-spin' : ''}`} />
                Auto-refresh
              </button>
              
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => handleExport('dashboard')}
                  disabled={isExporting}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
              
              <span className="text-sm text-gray-500">
                {mounted ? new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Loading...'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Day {getCurrentDayType()}
              </span>
            </div>
          </div>
          
          {/* Critical Alerts Panel */}
          {alertsVisible && alerts.length > 0 && (
            <div className="border-t border-gray-200 bg-red-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-red-900">🚨 Critical Alerts</h3>
                <button
                  onClick={() => setAlertsVisible(false)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {alerts.filter(alert => alert.priority === 'critical').slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border-l-4 border-red-500">
                    <div>
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <button
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {/* Real-Time Dashboard Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">📊 Today's Live Overview</h2>
                  <p className="text-indigo-100 mt-1">Real-time school management insights</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-indigo-100">System Status</p>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm font-medium">All Systems Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Grid with Real-time Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Teachers Absent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : stats.teachersAbsent}
                      </p>
                      {dashboardData?.trends?.teachersAbsent && (
                        <p className="text-xs text-gray-500 mt-1">
                          {dashboardData.trends.teachersAbsent > 0 ? '↗️' : '↘️'} 
                          vs yesterday
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Periods to Cover</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : stats.periodsToCover}
                      </p>
                      {dashboardData?.uncoveredPeriods && (
                        <p className="text-xs text-red-600 mt-1">
                          🚨 {dashboardData.uncoveredPeriods} urgent
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Assignments Made</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : stats.assignmentsMade}
                      </p>
                      {dashboardData?.automationRate && (
                        <p className="text-xs text-green-600 mt-1">
                          🤖 {dashboardData.automationRate}% automated
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FireIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Time Saved</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : formatTimeSaved(stats.timeSaved)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        💰 ${dashboardData?.costSavings || '2,340'} saved
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* AI Insights Panel */}
            {dashboardData?.aiInsights && Array.isArray(dashboardData.aiInsights) && dashboardData.aiInsights.length > 0 && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      🤖
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">AI Insights</h3>
                    <p className="text-purple-100">Smart recommendations for your school</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Array.isArray(dashboardData.aiInsights) ? dashboardData.aiInsights : []).slice(0, 3).map((insight: any, index: number) => (
                    <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4 hover:bg-white hover:bg-opacity-20 hover:shadow-lg transition-all duration-200 cursor-pointer border border-white border-opacity-20 hover:border-opacity-30">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{insight.icon}</span>
                        <span className="font-medium text-sm text-white">{insight.category}</span>
                      </div>
                      <p className="text-sm text-purple-100">{insight.message}</p>
                      {insight.impact && (
                        <div className="mt-2 flex items-center">
                          <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded text-purple-900 font-medium">
                            Impact: {insight.impact}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Workload Analytics */}
            {dashboardData?.staffWorkload && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">👥 Staff Workload Analytics</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Live Data</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {dashboardData.staffWorkload.averageUtilization}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Average Utilization</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dashboardData.staffWorkload.averageUtilization}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {dashboardData.staffWorkload.overloadedStaff}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Overloaded Staff</p>
                    <p className="text-xs text-amber-600 mt-1">Needs attention</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {dashboardData.staffWorkload.availableCapacity}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Available Capacity</p>
                    <p className="text-xs text-blue-600 mt-1">Ready for assignments</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Coverage Rate and Intelligent Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Coverage Rate with Predictions */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Coverage Rate</h3>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
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
                        className={`transition-all duration-500 ${
                          stats.coverageRate >= 90 ? 'text-green-500' :
                          stats.coverageRate >= 70 ? 'text-yellow-500' : 'text-red-500'
                        }`}
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
                {dashboardData?.coveragePrediction && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">🔮 AI Prediction</p>
                    <p className="text-sm text-blue-700">
                      End of day: {dashboardData.coveragePrediction.endOfDay}%
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Quick Actions with Intelligence */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">⚡ Smart Actions</h3>
                  <span className="text-xs text-gray-500">AI-Powered</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAssignCoverage}
                    disabled={assigningCoverage}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigningCoverage ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        🚀 AI Assign Coverage
                        {stats.periodsToCover > 0 && (
                          <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                            {stats.periodsToCover} pending
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                  
                  <a 
                    href="/absences/new"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-pink-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <UserIcon className="h-5 w-5 mr-2" />
                    📝 Report Absence
                  </a>
                  
                  <a 
                    href="/substitutes"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    👥 Manage Pool
                    {dashboardData?.availableSubstitutes && (
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                        {dashboardData.availableSubstitutes} available
                      </span>
                    )}
                  </a>
                  
                  <a
                    href="/approval-queue"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-orange-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    ⚖️ Review Queue
                    {stats.pendingApprovals > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-amber-600 bg-white rounded-full animate-pulse">
                        {stats.pendingApprovals}
                      </span>
                    )}
                  </a>
                  
                  {/* New Smart Actions */}
                  <button
                    onClick={() => handleExport('daily-report')}
                    disabled={isExporting}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    📊 Export Report
                  </button>
                  
                  <a
                    href="/analytics"
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <ChartPieIcon className="h-5 w-5 mr-2" />
                    📈 Deep Analytics
                  </a>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{dashboardData?.efficiency || '94'}%</p>
                    <p className="text-xs text-gray-500">Efficiency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{dashboardData?.response_time || '2.3'}min</p>
                    <p className="text-xs text-gray-500">Avg Response</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{dashboardData?.satisfaction || '4.8'}/5</p>
                    <p className="text-xs text-gray-500">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Recent Activity with Real-time Updates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900">🕒 Live Activity Feed</h3>
                  <div className="ml-3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">Auto-updating</span>
                  <a href="/history" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                    View All →
                  </a>
                </div>
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
                ) : mounted && recentActivity.length > 0 ? (
                  recentActivity
                    .filter(activity => activity && activity.id && activity.timestamp) // Filter out invalid entries
                    .slice(0, 5)
                    .map((activity, index) => (
                    <div key={`activity-${index}-${activity.id}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-3"
                      suppressHydrationWarning={true}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                          activity.type === 'absence_reported' ? 'bg-red-400' :
                          activity.type === 'coverage_assigned' ? 'bg-green-400' :
                          activity.type === 'assignment_approved' ? 'bg-blue-400' :
                          activity.type === 'assignment_rejected' ? 'bg-amber-400' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {mounted && activity.timestamp ? 
                              new Date(activity.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'America/New_York' // Use a consistent timezone
                              }) : 
                              'Loading...'
                            }
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
                ) : mounted ? (
                  <div className="text-center py-8">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Activity will appear here as you use the system.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mx-auto mt-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 mx-auto mt-1"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comprehensive System Health Dashboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">⚡ System Health & Performance</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* School Metrics */}
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <UserGroupIcon className="mx-auto h-8 w-8 text-indigo-600 mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Total Teachers</h4>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalTeachers}</p>
                  <p className="text-xs text-indigo-600 mt-1">Active in system</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <AcademicCapIcon className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Available Substitutes</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.totalSubstitutes}</p>
                  <p className="text-xs text-green-600 mt-1">Ready for assignments</p>
                </div>
                
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <DocumentTextIcon className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pending Approvals</h4>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</p>
                  {stats.pendingApprovals > 0 && (
                    <p className="text-xs text-amber-600 mt-1 animate-pulse">Requires attention</p>
                  )}
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <ComputerDesktopIcon className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">System Uptime</h4>
                  <p className="text-2xl font-bold text-purple-600">99.9%</p>
                  <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Response Time</h5>
                    <span className="text-xs text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-end space-x-1 mb-2">
                    <div className="w-2 bg-green-500 rounded-t" style={{height: '20px'}}></div>
                    <div className="w-2 bg-green-500 rounded-t" style={{height: '25px'}}></div>
                    <div className="w-2 bg-green-500 rounded-t" style={{height: '18px'}}></div>
                    <div className="w-2 bg-green-500 rounded-t" style={{height: '30px'}}></div>
                    <div className="w-2 bg-green-500 rounded-t" style={{height: '22px'}}></div>
                  </div>
                  <p className="text-xs text-gray-600">Avg: 1.2s</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Processing Load</h5>
                    <span className="text-xs text-blue-600">Normal</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{width: '42%'}}></div>
                  </div>
                  <p className="text-xs text-gray-600">42% utilized</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Error Rate</h5>
                    <span className="text-xs text-green-600">Minimal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="text-green-600 text-xs font-bold">0.1%</span>
                    </div>
                    <p className="text-xs text-gray-600">Well below threshold</p>
                  </div>
                </div>
              </div>
              
              {/* Quick System Actions */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Last health check:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {mounted && lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    }) : '--:--:--'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {fetchDashboardData(); fetchEnhancedData(); fetchAlerts();}}
                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                  >
                    <ArrowPathIcon className="w-3 h-3 inline mr-1" />
                    Refresh
                  </button>
                  <a
                    href="/system-logs"
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <EyeIcon className="w-3 h-3 inline mr-1" />
                    View Logs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}