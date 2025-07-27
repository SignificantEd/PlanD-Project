import { useState, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { ScheduleConfig } from './types';
import { 
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Step2Schedule() {
  const { wizardData, updateStepData } = useWizard();
  const [formData, setFormData] = useState<ScheduleConfig>({
    cycleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [
      { name: '1st Period', start: '08:00', end: '08:45' },
      { name: '2nd Period', start: '08:50', end: '09:35' },
      { name: '3rd Period', start: '09:40', end: '10:25' },
      { name: '4th Period', start: '10:30', end: '11:15' },
      { name: '5th Period', start: '11:20', end: '12:05' },
      { name: 'Lunch', start: '12:05', end: '12:35' },
      { name: '6th Period', start: '12:40', end: '13:25' },
      { name: '7th Period', start: '13:30', end: '14:15' }
    ],
    halfDays: [],
    lunchPeriods: ['Lunch'],
    roomSharing: false,
    ...wizardData.scheduleConfig
  });

  const [scheduleType, setScheduleType] = useState('traditional');

  useEffect(() => {
    updateStepData(2, formData);
  }, [formData]);

  const scheduleTypes = [
    {
      id: 'traditional',
      name: 'Traditional Schedule',
      description: 'Standard daily schedule with the same periods every day',
      cycleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
      id: 'ab_days',
      name: 'A/B Day Schedule',
      description: 'Alternating schedule with different periods on A and B days',
      cycleDays: ['A Day', 'B Day']
    },
    {
      id: 'block',
      name: 'Block Schedule',
      description: 'Longer periods with fewer classes per day',
      cycleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  ];

  const handleScheduleTypeChange = (type: string) => {
    setScheduleType(type);
    const selectedType = scheduleTypes.find(t => t.id === type);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        cycleDays: selectedType.cycleDays
      }));
    }
  };

  const addPeriod = () => {
    const newPeriod = {
      name: `Period ${formData.periods.length + 1}`,
      start: '08:00',
      end: '08:45'
    };
    setFormData(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod]
    }));
  };

  const removePeriod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  const updatePeriod = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    }));
  };

  const addHalfDay = () => {
    const dayName = prompt('Enter half day name (e.g., "Early Release Wednesday"):');
    if (dayName && !formData.halfDays.includes(dayName)) {
      setFormData(prev => ({
        ...prev,
        halfDays: [...prev.halfDays, dayName]
      }));
    }
  };

  const removeHalfDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      halfDays: prev.halfDays.filter(d => d !== day)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CalendarDaysIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Schedule Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure your school's schedule structure and timing
        </p>
      </div>

      {/* Schedule Type Selection */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Schedule Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheduleTypes.map((type) => (
            <div
              key={type.id}
              className={`relative rounded-lg border p-4 cursor-pointer ${
                scheduleType === type.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleScheduleTypeChange(type.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value={type.id}
                  checked={scheduleType === type.id}
                  onChange={() => handleScheduleTypeChange(type.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label className="ml-3 block text-sm font-medium text-gray-900">
                  {type.name}
                </label>
              </div>
              <p className="ml-7 text-sm text-gray-500">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Days */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">School Days</h4>
        <div className="flex flex-wrap gap-2">
          {formData.cycleDays.map((day, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Periods Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Daily Periods</h4>
          <button
            onClick={addPeriod}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Period
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.periods.map((period, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  value={period.name}
                  onChange={(e) => updatePeriod(index, 'name', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Period name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={period.start}
                  onChange={(e) => updatePeriod(index, 'start', e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={period.end}
                  onChange={(e) => updatePeriod(index, 'end', e.target.value)}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {formData.periods.length > 1 && (
                <button
                  onClick={() => removePeriod(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lunch Periods */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Lunch Periods</h4>
        <div className="space-y-2">
          {formData.periods.map((period, index) => (
            <label key={index} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.lunchPeriods.includes(period.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      lunchPeriods: [...prev.lunchPeriods, period.name]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      lunchPeriods: prev.lunchPeriods.filter(p => p !== period.name)
                    }));
                  }
                }}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{period.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Half Days */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Half Days / Special Schedules</h4>
          <button
            onClick={addHalfDay}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Half Day
          </button>
        </div>
        
        {formData.halfDays.length > 0 ? (
          <div className="space-y-2">
            {formData.halfDays.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-700">{day}</span>
                <button
                  onClick={() => removeHalfDay(day)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No half days configured</p>
        )}
      </div>

      {/* Additional Options */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Additional Options</h4>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.roomSharing}
              onChange={(e) => setFormData(prev => ({ ...prev, roomSharing: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Room sharing enabled (multiple teachers use the same classroom)
            </span>
          </label>
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Summary</h4>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Type:</span> {scheduleTypes.find(t => t.id === scheduleType)?.name}</p>
          <p><span className="font-medium">Periods per day:</span> {formData.periods.length}</p>
          <p><span className="font-medium">Lunch periods:</span> {formData.lunchPeriods.join(', ') || 'None'}</p>
          <p><span className="font-medium">Half days:</span> {formData.halfDays.length}</p>
        </div>
      </div>
    </div>
  );
} 