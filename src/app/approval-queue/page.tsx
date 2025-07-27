"use client"

import { useState, useEffect } from 'react';
import { IApprovalQueueItem } from '../../types/interfaces';
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
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function ApprovalQueuePage() {
  const [approvalItems, setApprovalItems] = useState<IApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Navigation items for the enterprise system
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar' },
    { name: 'Absent Staff', href: '/absences', icon: 'user-group' },
    { name: 'Substitute Pool', href: '/substitutes', icon: 'academic-cap' },
    { name: 'Settings', href: '/settings', icon: 'cog' },
    { name: 'Coverage Results', href: '/coverage-results', icon: 'check-circle' },
    { name: 'Approval Queue', href: '/approval-queue', icon: 'document-text', current: true, badge: approvalItems.length },
    { name: 'Reports', href: '/reports', icon: 'chart-bar' },
    { name: 'History', href: '/history', icon: 'clock' }
  ];

  useEffect(() => {
    setMounted(true);
    fetchApprovalQueue();
  }, []);

  const fetchApprovalQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/approval-queue');
      if (response.ok) {
        const data = await response.json();
        setApprovalItems(data);
      }
    } catch (error) {
      console.error('Error fetching approval queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      setProcessing(assignmentId);
      const response = await fetch(`/api/admin/approve-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId, action: 'approve' }),
      });

      if (response.ok) {
        // Remove the item from the queue
        setApprovalItems(prev => prev.filter(item => item.assignment.id !== assignmentId));
      } else {
        alert('Failed to approve assignment');
      }
    } catch (error) {
      console.error('Error approving assignment:', error);
      alert('Error approving assignment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (assignmentId: string, reason: string) => {
    try {
      setProcessing(assignmentId);
      const response = await fetch(`/api/admin/approve-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId, action: 'reject', reason }),
      });

      if (response.ok) {
        // Remove the item from the queue
        setApprovalItems(prev => prev.filter(item => item.assignment.id !== assignmentId));
      } else {
        alert('Failed to reject assignment');
      }
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      alert('Error rejecting assignment');
    } finally {
      setProcessing(null);
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

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'Manual Override':
        return 'bg-purple-100 text-purple-800';
      case 'External Sub':
        return 'bg-green-100 text-green-800';
      case 'Internal Coverage':
        return 'bg-blue-100 text-blue-800';
      case 'Emergency Coverage':
        return 'bg-red-100 text-red-800';
      case 'No Coverage':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Manual Override':
        return '👤';
      case 'External Sub':
        return '🎓';
      case 'Internal Coverage':
        return '👨‍🏫';
      case 'Emergency Coverage':
        return '🚨';
      case 'No Coverage':
        return '❌';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                <p className="text-sm text-gray-600">Approval Queue Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {mounted ? new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Loading...'}
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
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Approval Queue</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and approve pending coverage assignments
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    {loading ? '...' : approvalItems.length} Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Items */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : approvalItems.length > 0 ? (
              <div className="space-y-4">
                {approvalItems.map((item) => (
                  <div key={item.assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="text-2xl">{getAssignmentTypeIcon(item.assignment.assignmentType)}</span>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.absence.absentTeacherName} - {item.assignment.period}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(item.assignment.date).toLocaleDateString()} • Day {item.absence.dayType}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentTypeColor(item.assignment.assignmentType)}`}>
                            {item.assignment.assignmentType}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Assigned To</p>
                            <p className="text-sm text-gray-900">{item.assignment.assignedToName || 'Unassigned'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Department</p>
                            <p className="text-sm text-gray-900">{item.teacher.department}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Absence Type</p>
                            <p className="text-sm text-gray-900">{item.absence.type}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Status</p>
                            <p className="text-sm text-gray-900">{item.assignment.status}</p>
                          </div>
                        </div>

                        {item.assignment.notes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Notes</p>
                            <p className="text-sm text-gray-900">{item.assignment.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleApprove(item.assignment.id)}
                          disabled={processing === item.assignment.id}
                          className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === item.assignment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </button>
                        
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:');
                            if (reason) {
                              handleReject(item.assignment.id, reason);
                            }
                          }}
                          disabled={processing === item.assignment.id}
                          className="flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === item.assignment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <XMarkIcon className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments awaiting approval</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All coverage assignments have been reviewed and processed.
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-amber-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">{approvalItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved Today</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <XMarkIcon className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected Today</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 