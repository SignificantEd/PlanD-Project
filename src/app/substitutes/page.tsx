'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Calendar, CheckCircle, Clock } from 'lucide-react';

interface Substitute {
  id: string;
  name: string;
  email: string;
  cell: string;
  subjectSpecialties: string[];
  availability: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export default function SubstitutesPage() {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubstitutes = async () => {
    try {
      const response = await fetch('/api/substitutes/all');
      if (response.ok) {
        const data = await response.json();
        setSubstitutes(data);
      } else {
        setError('Failed to fetch substitutes');
      }
    } catch (error) {
      console.error('Error fetching substitutes:', error);
      setError('Error loading substitutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutes();
  }, []);

  const formatAvailability = (availability: Record<string, string[]>) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.map(day => {
      const periods = availability[day] || [];
      return {
        day,
        periods: periods.length > 0 ? periods.join(', ') : 'Not Available'
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading substitutes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">👥 Substitute Management</h1>
          <div className="flex gap-4">
            <Button onClick={fetchSubstitutes}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mb-6 flex space-x-6 border-b pb-4">
          <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
          <a href="/substitutes" className="text-indigo-700 font-semibold underline">Substitutes</a>
          <a href="/master-schedule" className="text-indigo-700 font-semibold hover:underline">Master Schedule</a>
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">Total Substitutes</h3>
            <p className="text-2xl font-bold">{substitutes.length}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">Available Today</h3>
            <p className="text-2xl font-bold text-green-600">
              {substitutes.filter(sub => {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                return sub.availability[today] && sub.availability[today].length > 0;
              }).length}
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">Full-Time Available</h3>
            <p className="text-2xl font-bold text-blue-600">
              {substitutes.filter(sub => {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const todayPeriods = sub.availability[today] || [];
                return todayPeriods.length >= 6; // Consider 6+ periods as full-time
              }).length}
            </p>
          </Card>
        </div>

        {/* Substitutes List */}
        <div className="space-y-4">
          {substitutes.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No substitutes found</p>
            </Card>
          ) : (
            substitutes.map((substitute) => (
              <Card key={substitute.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold">{substitute.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {substitute.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {substitute.cell || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Subject Specialties */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Subject Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {substitute.subjectSpecialties && substitute.subjectSpecialties.length > 0 ? (
                      substitute.subjectSpecialties.map((subject, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No specialties listed</span>
                    )}
                  </div>
                </div>

                {/* Weekly Availability */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Weekly Availability:
                  </h4>
                  <div className="grid grid-cols-5 gap-3">
                    {formatAvailability(substitute.availability).map(({ day, periods }) => (
                      <div key={day} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-sm text-gray-700 mb-1">{day}</div>
                        <div className="text-xs text-gray-600">
                          {periods === 'Not Available' ? (
                            <span className="text-red-600">Not Available</span>
                          ) : (
                            <span className="text-green-600">{periods}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Created Date */}
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Added: {new Date(substitute.createdAt).toLocaleDateString()}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 