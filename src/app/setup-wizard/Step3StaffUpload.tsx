import { useState, useEffect, useRef } from 'react';
import { useWizard } from './WizardContext';
import { StaffUpload } from './types';
import { 
  DocumentArrowUpIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Step3StaffUpload() {
  const { wizardData, updateStepData } = useWizard();
  const [formData, setFormData] = useState<StaffUpload>({
    file: null,
    teachers: [],
    ...wizardData.staffUpload
  });
  const [uploadMethod, setUploadMethod] = useState<'file' | 'manual'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateStepData(3, formData);
  }, [formData]);

  const departments = [
    'Mathematics', 'Science', 'English', 'History', 'Foreign Languages',
    'Physical Education', 'Arts', 'Music', 'Special Education', 'Other'
  ];

  const roles = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'paraprofessional', label: 'Paraprofessional' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'admin', label: 'Administrator' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setFormData(prev => ({ ...prev, file }));
    setParseErrors([]);

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      try {
        const text = await file.text();
        const parsed = parseCSV(text);
        setFormData(prev => ({ ...prev, teachers: parsed }));
      } catch (error) {
        setParseErrors(['Error parsing CSV file. Please check the format.']);
      }
    } else {
      setParseErrors(['Please upload a CSV file.']);
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const teachers = [];

    // Expected headers: name, email, department, role
    const requiredHeaders = ['name', 'email', 'department'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const teacher: any = {};

      headers.forEach((header, index) => {
        teacher[header] = values[index] || '';
      });

      // Set defaults
      teacher.role = teacher.role || 'teacher';
      teacher.id = `temp-${i}`;

      teachers.push(teacher);
    }

    return teachers;
  };

  const addManualTeacher = () => {
    const newTeacher = {
      id: `manual-${Date.now()}`,
      name: '',
      email: '',
      department: '',
      role: 'teacher'
    };
    setFormData(prev => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher]
    }));
  };

  const updateTeacher = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      teachers: prev.teachers.map(teacher => 
        teacher.id === id ? { ...teacher, [field]: value } : teacher
      )
    }));
  };

  const removeTeacher = (id: string) => {
    setFormData(prev => ({
      ...prev,
      teachers: prev.teachers.filter(teacher => teacher.id !== id)
    }));
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,department,role\n' +
                      'John Smith,john.smith@school.edu,Mathematics,teacher\n' +
                      'Jane Doe,jane.doe@school.edu,Science,teacher\n' +
                      'Bob Johnson,bob.johnson@school.edu,English,department_head';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staff_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <UserGroupIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Staff Data Upload</h3>
        <p className="mt-1 text-sm text-gray-500">
          Import your teaching staff information to set up the coverage system
        </p>
      </div>

      {/* Upload Method Selection */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setUploadMethod('file')}
          className={`px-4 py-2 rounded-lg border ${
            uploadMethod === 'file'
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <DocumentArrowUpIcon className="h-5 w-5 inline mr-2" />
          Upload CSV File
        </button>
        <button
          onClick={() => setUploadMethod('manual')}
          className={`px-4 py-2 rounded-lg border ${
            uploadMethod === 'manual'
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <PlusIcon className="h-5 w-5 inline mr-2" />
          Enter Manually
        </button>
      </div>

      {uploadMethod === 'file' && (
        <div className="space-y-4">
          {/* CSV Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">Need a template?</h4>
                <p className="text-sm text-blue-700">Download our CSV template to get started</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Download Template
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV files only</p>
            
            {formData.file && (
              <div className="mt-3 flex items-center justify-center text-sm text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {formData.file.name} uploaded
              </div>
            )}
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700">
                {parseErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Staff List */}
      {formData.teachers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Staff Members ({formData.teachers.length})
            </h4>
            {uploadMethod === 'manual' && (
              <button
                onClick={addManualTeacher}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 inline mr-1" />
                Add Staff
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 uppercase tracking-wide">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="divide-y divide-gray-200">
              {formData.teachers.map((teacher, index) => (
                <div key={teacher.id} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={teacher.name}
                      onChange={(e) => updateTeacher(teacher.id, 'name', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="email"
                      value={teacher.email}
                      onChange={(e) => updateTeacher(teacher.id, 'email', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="email@school.edu"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={teacher.department}
                      onChange={(e) => updateTeacher(teacher.id, 'department', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select...</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={teacher.role}
                      onChange={(e) => updateTeacher(teacher.id, 'role', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => removeTeacher(teacher.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Option */}
      {uploadMethod === 'manual' && formData.teachers.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first staff member.</p>
          <div className="mt-6">
            <button
              onClick={addManualTeacher}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Staff Member
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {formData.teachers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Staff Summary</h4>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Total staff:</span> {formData.teachers.length}</p>
            <p><span className="font-medium">Teachers:</span> {formData.teachers.filter(t => t.role === 'teacher').length}</p>
            <p><span className="font-medium">Paraprofessionals:</span> {formData.teachers.filter(t => t.role === 'paraprofessional').length}</p>
            <p><span className="font-medium">Department heads:</span> {formData.teachers.filter(t => t.role === 'department_head').length}</p>
          </div>
        </div>
      )}
    </div>
  );
} 