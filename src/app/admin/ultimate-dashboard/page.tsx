'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  timestamp: string;
  todayStats: {
    absentTeachers: number;
    totalPeriods: number;
    coveredPeriods: number;
    uncoveredPeriods: number;
    coverageRate: number;
  };
  uncoveredAlerts: any[];
  substituteWorkload: Array<{
    id: string;
    name: string;
    email: string;
    assignments: number;
    acceptanceRate: number;
    isActive: boolean;
  }>;
  recentActions: Array<{
    id: string;
    timestamp: string;
    teacherName: string;
    action: string;
    status: string;
  }>;
  systemHealth: {
    algorithmPerformance: string;
    emailDeliveryRate: number;
    databaseResponse: string;
    uptime: string;
  };
  communicationMetrics: {
    emailsSentToday: number;
    deliverySuccess: number;
    openRate: number;
    avgResponseTime: string;
  };
  aiInsights: {
    tomorrowRisk: string;
    predictedAbsences: number;
    weeklyForecast: string;
    recommendation: string;
    costProjection: string;
    budgetVariance: string;
  };
  trends: {
    coverageRateWeek: number[];
    costTrend: number[];
  };
}

export default function UltimateDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-50';
    if (rate >= 85) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Ultimate Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🏫 PlanD Ultimate Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">LIVE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Update</p>
                <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded text-sm ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchDashboardData}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Today's Live Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Today's Live Overview - {new Date().toLocaleDateString()}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Absent Teachers */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {dashboardData.todayStats.absentTeachers}
                </div>
                <div className="text-sm text-yellow-600">Teachers Absent</div>
                <div className="text-xs text-yellow-500 mt-1">
                  {((dashboardData.todayStats.absentTeachers / 52) * 100).toFixed(1)}% of staff
                </div>
              </div>
            </div>

            {/* Coverage Rate */}
            <div className={`border rounded-lg p-4 ${getStatusColor(dashboardData.todayStats.coverageRate)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboardData.todayStats.coverageRate}%
                </div>
                <div className="text-sm">Coverage Rate</div>
                <div className="text-xs mt-1">
                  {dashboardData.todayStats.coveredPeriods}/{dashboardData.todayStats.totalPeriods} periods
                </div>
              </div>
            </div>

            {/* Uncovered Periods */}
            <div className={`border rounded-lg p-4 ${
              dashboardData.todayStats.uncoveredPeriods === 0 
                ? 'text-green-600 bg-green-50 border-green-200' 
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {dashboardData.todayStats.uncoveredPeriods}
                </div>
                <div className="text-sm">Uncovered Periods</div>
                <div className="text-xs mt-1">
                  {dashboardData.todayStats.uncoveredPeriods === 0 ? '✅ All Covered' : '🚨 Need Attention'}
                </div>
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {dashboardData.systemHealth.algorithmPerformance}
                </div>
                <div className="text-sm text-blue-600">Algorithm Speed</div>
                <div className="text-xs text-blue-500 mt-1">⚡ Fast Processing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {dashboardData.todayStats.uncoveredPeriods > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              🚨 Critical Alerts - Immediate Action Required
            </h3>
            <div className="space-y-2">
              {/* Simulated alerts */}
              <div className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                <div>
                  <span className="font-medium text-red-700">Period 3: Math (Room 205)</span>
                  <span className="text-red-600 ml-2">- No substitute available</span>
                </div>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                  ASSIGN NOW
                </button>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                <div>
                  <span className="font-medium text-red-700">Period 5: Science (Room 301)</span>
                  <span className="text-red-600 ml-2">- Constraint violation</span>
                </div>
                <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                  OVERRIDE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff Workload Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            👥 Staff Workload Distribution (Last 30 Days)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">⭐ Top Performing Substitutes</h4>
              <div className="space-y-2">
                {dashboardData.substituteWorkload.slice(0, 5).map((sub, index) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{sub.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({sub.assignments} assignments)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        sub.acceptanceRate >= 90 ? 'text-green-600' : 
                        sub.acceptanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sub.acceptanceRate}%
                      </div>
                      <div className="text-xs text-gray-500">acceptance</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workload Chart Placeholder */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">📊 Coverage Trend (7 Days)</h4>
              <div className="h-32 bg-gray-50 rounded flex items-end justify-around p-4">
                {dashboardData.trends.coverageRateWeek.map((rate, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-indigo-500 rounded-t"
                      style={{ 
                        height: `${(rate / 100) * 80}px`,
                        width: '20px'
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-1">{rate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">
            🤖 AI Insights & Predictions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Tomorrow's Risk Level:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getRiskColor(dashboardData.aiInsights.tomorrowRisk)}`}>
                  {dashboardData.aiInsights.tomorrowRisk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Predicted Absences:</span>
                <span className="font-medium">{dashboardData.aiInsights.predictedAbsences}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Weekly Forecast:</span>
                <span className="font-medium">{dashboardData.aiInsights.weeklyForecast}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-purple-700">💡 Recommendation:</span>
                <p className="text-purple-600 mt-1">{dashboardData.aiInsights.recommendation}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Cost Projection:</span>
                <span className="font-medium">{dashboardData.aiInsights.costProjection}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health & Communication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Algorithm Performance:</span>
                <span className="text-green-600 font-medium">
                  {dashboardData.systemHealth.algorithmPerformance} ✅
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email Delivery Rate:</span>
                <span className="text-green-600 font-medium">
                  {dashboardData.systemHealth.emailDeliveryRate}% ✅
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Response:</span>
                <span className="text-green-600 font-medium">
                  {dashboardData.systemHealth.databaseResponse} ✅
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">System Uptime:</span>
                <span className="text-green-600 font-medium">
                  {dashboardData.systemHealth.uptime} ✅
                </span>
              </div>
            </div>
          </div>

          {/* Communication Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 Communication Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Emails Sent Today:</span>
                <span className="font-medium">{dashboardData.communicationMetrics.emailsSentToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Success:</span>
                <span className="text-green-600 font-medium">
                  {dashboardData.communicationMetrics.deliverySuccess}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Open Rate:</span>
                <span className="font-medium">{dashboardData.communicationMetrics.openRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="font-medium">{dashboardData.communicationMetrics.avgResponseTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors">
              🚨 Emergency Protocol
            </button>
            <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
              ✅ Bulk Approve
            </button>
            <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              👥 Call Backup Staff
            </button>
            <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              📤 Export Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
