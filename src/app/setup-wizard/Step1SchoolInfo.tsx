import { useState, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { SchoolInfo } from './types';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function Step1SchoolInfo() {
  const { wizardData, updateStepData } = useWizard();
  const [formData, setFormData] = useState<SchoolInfo>({
    name: '',
    location: '',
    type: 'public',
    studentCount: 0,
    coverageResponsibility: 'admin',
    contact: '',
    ...wizardData.schoolInfo
  });

  useEffect(() => {
    updateStepData(1, formData);
  }, [formData]);

  const handleInputChange = (field: keyof SchoolInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">School Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your school to customize the coverage management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Name */}
        <div className="md:col-span-2">
          <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
            School Name *
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="schoolName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Lincoln High School"
              required
            />
            <BuildingOfficeIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location *
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 123 Main St, Springfield, IL 62701"
              required
            />
            <MapPinIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* School Type */}
        <div>
          <label htmlFor="schoolType" className="block text-sm font-medium text-gray-700">
            School Type *
          </label>
          <select
            id="schoolType"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="public">Public School</option>
            <option value="private">Private School</option>
            <option value="charter">Charter School</option>
            <option value="magnet">Magnet School</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Student Count */}
        <div>
          <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700">
            Student Count *
          </label>
          <div className="mt-1 relative">
            <input
              type="number"
              id="studentCount"
              value={formData.studentCount || ''}
              onChange={(e) => handleInputChange('studentCount', parseInt(e.target.value) || 0)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 850"
              min="1"
              required
            />
            <UserGroupIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Coverage Responsibility */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Who manages substitute coverage? *
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="admin"
                name="coverageResponsibility"
                type="radio"
                value="admin"
                checked={formData.coverageResponsibility === 'admin'}
                onChange={(e) => handleInputChange('coverageResponsibility', e.target.value)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label htmlFor="admin" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">School Administration</span>
                <span className="block text-gray-500">Admins handle all coverage assignments</span>
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="department"
                name="coverageResponsibility"
                type="radio"
                value="department"
                checked={formData.coverageResponsibility === 'department'}
                onChange={(e) => handleInputChange('coverageResponsibility', e.target.value)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label htmlFor="department" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">Department Heads</span>
                <span className="block text-gray-500">Department heads manage their own coverage</span>
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="hybrid"
                name="coverageResponsibility"
                type="radio"
                value="hybrid"
                checked={formData.coverageResponsibility === 'hybrid'}
                onChange={(e) => handleInputChange('coverageResponsibility', e.target.value)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label htmlFor="hybrid" className="ml-3 block text-sm text-gray-700">
                <span className="font-medium">Hybrid Approach</span>
                <span className="block text-gray-500">Shared responsibility between admin and departments</span>
              </label>
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="md:col-span-2">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
            Primary Contact (Email) *
          </label>
          <div className="mt-1 relative">
            <input
              type="email"
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="admin@school.edu"
              required
            />
            <EnvelopeIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This contact will receive setup confirmations and system notifications
          </p>
        </div>
      </div>

      {/* Preview Card */}
      {formData.name && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">{formData.name}</span> - {formData.type} school</p>
            <p>{formData.location}</p>
            <p>{formData.studentCount} students</p>
            <p>Coverage managed by: {formData.coverageResponsibility}</p>
          </div>
        </div>
      )}
    </div>
  );
} 