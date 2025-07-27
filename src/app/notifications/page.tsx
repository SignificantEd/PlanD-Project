'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NotificationTest from '../../components/NotificationTest';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📬 Email Notifications
              </h1>
              <p className="mt-2 text-gray-600">
                Test and manage the PlanD notification system
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logged in as</p>
              <p className="font-medium text-gray-900">{session.user?.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => router.push('/absences/new')}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                Report Absence
              </button>
              <button
                onClick={() => router.push('/approval-queue')}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                Approval Queue
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Notification Test Component */}
            <NotificationTest />

            {/* How It Works Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🔄 How Email Notifications Work
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-800">1. Absence Reported</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      When an absence is created, the algorithm automatically runs
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-medium text-green-800">2. Assignments Made</h4>
                    <p className="text-green-700 text-sm mt-1">
                      The 5-phase algorithm assigns substitutes and teachers
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h4 className="font-medium text-purple-800">3. Notifications Sent</h4>
                    <p className="text-purple-700 text-sm mt-1">
                      Automatic emails sent to assigned staff and administrators
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <h4 className="font-medium text-yellow-800">4. Admin Alerts</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Alerts sent for uncovered periods and issues
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-red-800">5. Emergency Cases</h4>
                    <p className="text-red-700 text-sm mt-1">
                      Special notifications for emergency overrides
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-gray-500 bg-gray-50">
                    <h4 className="font-medium text-gray-800">6. Daily Summary</h4>
                    <p className="text-gray-700 text-sm mt-1">
                      End-of-day reports for office staff and administrators
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Types Detail */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                📧 Email Types and Content
              </h3>
              
              <div className="grid gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🎯 Substitute Assignment</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    Sent to substitutes when they're assigned to cover a class
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Teacher they're covering for</li>
                    <li>• Date, periods, subjects, and rooms</li>
                    <li>• Special notes or instructions</li>
                    <li>• Arrival time recommendations</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">👨‍🏫 Teacher Coverage</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    Sent to internal teachers assigned to cover during free periods
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Coverage assignment details</li>
                    <li>• Emergency assignment notices (if applicable)</li>
                    <li>• Compensation information</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🚨 Admin Alerts</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    Sent to administrators for issues requiring attention
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Uncovered periods</li>
                    <li>• Constraint violations</li>
                    <li>• Emergency overrides</li>
                    <li>• System issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
