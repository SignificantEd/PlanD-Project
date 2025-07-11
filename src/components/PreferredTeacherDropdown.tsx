"use client";

import { useState, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
}

interface PreferredTeacherDropdownProps {
  selectedTeacherId?: string;
  onTeacherSelect: (teacherId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export default function PreferredTeacherDropdown({
  selectedTeacherId,
  onTeacherSelect,
  placeholder = "Select preferred teacher (optional)",
  className = ""
}: PreferredTeacherDropdownProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacherId && teachers.length > 0) {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      setSelectedTeacher(teacher || null);
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
        setFilteredTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = (teacher: Teacher | null) => {
    setSelectedTeacher(teacher);
    onTeacherSelect(teacher?.id || null);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedTeacher(null);
    onTeacherSelect(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Preferred Teacher
        <span className="text-gray-500 text-xs ml-1">(Optional - for targeted assignments)</span>
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              {selectedTeacher ? (
                <div>
                  <span className="text-gray-900">{selectedTeacher.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({selectedTeacher.department})</span>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center">
              {selectedTeacher && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-gray-600 mr-2"
                >
                  ×
                </button>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Clear Selection Option */}
            <div className="py-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => handleTeacherSelect(null)}
                className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 flex items-center"
              >
                <span className="text-gray-400 mr-2">×</span>
                No preferred teacher
              </button>
            </div>

            {/* Teachers List */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-gray-500">Loading teachers...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">No teachers found</div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => handleTeacherSelect(teacher)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                      selectedTeacher?.id === teacher.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-sm text-gray-500">{teacher.department}</div>
                    </div>
                    {selectedTeacher?.id === teacher.id && (
                      <div className="text-indigo-600">✓</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {selectedTeacher && (
        <div className="mt-2 text-sm text-gray-600">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="flex items-center">
              <div className="text-blue-800">
                <strong>Preferred Assignment:</strong> This substitute will be prioritized when <strong>{selectedTeacher.name}</strong> is absent.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 