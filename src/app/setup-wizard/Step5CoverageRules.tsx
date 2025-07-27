import { useState, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { CoverageRules } from './types';
import { 
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Step5CoverageRules() {
  const { wizardData, updateStepData } = useWizard();
  const [formData, setFormData] = useState<CoverageRules>({
    constraints: {
      maxSubstituteCoverage: 6,
      maxInternalCoverageNormal: 2,
      maxInternalCoverageEmergency: 4,
      departmentMatchingEnabled: true,
      workloadBalancingEnabled: true,
      approvalRequired: false,
      unionCompliance: true,
      maxConsecutivePeriods: 4,
      preventLunchCoverage: true,
      preventPrepCoverage: false,
      subjectMatchPreference: true,
      experienceWeighting: true,
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        adminAlerts: true,
        dailyReports: true
      },
      emergencyProtocols: {
        autoAssignUncovered: true,
        escalationTime: 30,
        backupContacts: []
      }
    },
    ...wizardData.coverageRules
  });

  useEffect(() => {
    updateStepData(5, formData);
  }, [formData]);

  const updateConstraint = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addBackupContact = () => {
    const name = prompt('Enter backup contact name:');
    const phone = prompt('Enter phone number:');
    if (name && phone) {
      const newContact = { name, phone };
      updateConstraint('constraints.emergencyProtocols.backupContacts', [
        ...formData.constraints.emergencyProtocols.backupContacts,
        newContact
      ]);
    }
  };

  const removeBackupContact = (index: number) => {
    updateConstraint('constraints.emergencyProtocols.backupContacts',
      formData.constraints.emergencyProtocols.backupContacts.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CogIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Coverage Rules & Constraints</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure policies and rules for automated coverage assignments
        </p>
      </div>

      {/* Coverage Limits */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Coverage Limits</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Substitute Coverage (periods/day)
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.constraints.maxSubstituteCoverage}
              onChange={(e) => updateConstraint('constraints.maxSubstituteCoverage', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum periods a substitute can cover per day</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Internal Coverage (normal)
            </label>
            <input
              type="number"
              min="0"
              max="4"
              value={formData.constraints.maxInternalCoverageNormal}
              onChange={(e) => updateConstraint('constraints.maxInternalCoverageNormal', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Max additional periods teachers cover in normal situations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Internal Coverage (emergency)
            </label>
            <input
              type="number"
              min="0"
              max="6"
              value={formData.constraints.maxInternalCoverageEmergency}
              onChange={(e) => updateConstraint('constraints.maxInternalCoverageEmergency', parseInt(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Max additional periods teachers cover in emergencies</p>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Max Consecutive Periods
            </label>
            <input
              type="number"
              min="2"
              max="8"
              value={formData.constraints.maxConsecutivePeriods}
              onChange={(e) => updateConstraint('constraints.maxConsecutivePeriods', parseInt(e.target.value))}
              className="mt-1 block w-full md:w-48 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum consecutive teaching periods for any staff member</p>
          </div>
        </div>
      </div>

      {/* Assignment Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Assignment Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Department Matching</h5>
              <p className="text-sm text-gray-500">Prefer assigning coverage within the same department</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.departmentMatchingEnabled}
                onChange={(e) => updateConstraint('constraints.departmentMatchingEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Workload Balancing</h5>
              <p className="text-sm text-gray-500">Distribute coverage assignments fairly across staff</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.workloadBalancingEnabled}
                onChange={(e) => updateConstraint('constraints.workloadBalancingEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Subject Match Preference</h5>
              <p className="text-sm text-gray-500">Prefer substitutes with matching subject expertise</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.subjectMatchPreference}
                onChange={(e) => updateConstraint('constraints.subjectMatchPreference', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Experience Weighting</h5>
              <p className="text-sm text-gray-500">Factor in substitute experience and ratings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.experienceWeighting}
                onChange={(e) => updateConstraint('constraints.experienceWeighting', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Protection Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Protection Rules</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Prevent Lunch Coverage</h5>
              <p className="text-sm text-gray-500">Protect lunch periods from coverage assignments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.preventLunchCoverage}
                onChange={(e) => updateConstraint('constraints.preventLunchCoverage', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Prevent Prep Coverage</h5>
              <p className="text-sm text-gray-500">Protect preparation periods from coverage assignments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.preventPrepCoverage}
                onChange={(e) => updateConstraint('constraints.preventPrepCoverage', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Union Compliance</h5>
              <p className="text-sm text-gray-500">Enforce union contract limitations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.unionCompliance}
                onChange={(e) => updateConstraint('constraints.unionCompliance', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Approval Required</h5>
              <p className="text-sm text-gray-500">Require admin approval for all assignments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.approvalRequired}
                onChange={(e) => updateConstraint('constraints.approvalRequired', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Email Notifications</h5>
              <p className="text-sm text-gray-500">Send email alerts for coverage assignments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.notificationSettings.emailNotifications}
                onChange={(e) => updateConstraint('constraints.notificationSettings.emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">SMS Notifications</h5>
              <p className="text-sm text-gray-500">Send text message alerts for urgent situations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.notificationSettings.smsNotifications}
                onChange={(e) => updateConstraint('constraints.notificationSettings.smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Admin Alerts</h5>
              <p className="text-sm text-gray-500">Notify administrators of critical issues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.notificationSettings.adminAlerts}
                onChange={(e) => updateConstraint('constraints.notificationSettings.adminAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Daily Reports</h5>
              <p className="text-sm text-gray-500">Send daily coverage summary reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.notificationSettings.dailyReports}
                onChange={(e) => updateConstraint('constraints.notificationSettings.dailyReports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Emergency Protocols */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Protocols</h4>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Auto-assign Uncovered Periods</h5>
              <p className="text-sm text-gray-500">Automatically assign coverage when no substitutes are available</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints.emergencyProtocols.autoAssignUncovered}
                onChange={(e) => updateConstraint('constraints.emergencyProtocols.autoAssignUncovered', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Escalation Time (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={formData.constraints.emergencyProtocols.escalationTime}
              onChange={(e) => updateConstraint('constraints.emergencyProtocols.escalationTime', parseInt(e.target.value))}
              className="mt-1 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Time before escalating to backup contacts</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Emergency Backup Contacts
              </label>
              <button
                onClick={addBackupContact}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
              >
                Add Contact
              </button>
            </div>
            
            {formData.constraints.emergencyProtocols.backupContacts.length > 0 ? (
              <div className="space-y-2">
                {formData.constraints.emergencyProtocols.backupContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-700">{contact.name} - {contact.phone}</span>
                    <button
                      onClick={() => removeBackupContact(index)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No backup contacts added</p>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <h4 className="text-lg font-medium text-indigo-900">Configuration Summary</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium text-indigo-900">Max substitute periods:</span> {formData.constraints.maxSubstituteCoverage}</p>
            <p><span className="font-medium text-indigo-900">Max internal coverage:</span> {formData.constraints.maxInternalCoverageNormal} (normal), {formData.constraints.maxInternalCoverageEmergency} (emergency)</p>
            <p><span className="font-medium text-indigo-900">Max consecutive periods:</span> {formData.constraints.maxConsecutivePeriods}</p>
          </div>
          <div>
            <p><span className="font-medium text-indigo-900">Department matching:</span> {formData.constraints.departmentMatchingEnabled ? 'Enabled' : 'Disabled'}</p>
            <p><span className="font-medium text-indigo-900">Workload balancing:</span> {formData.constraints.workloadBalancingEnabled ? 'Enabled' : 'Disabled'}</p>
            <p><span className="font-medium text-indigo-900">Approval required:</span> {formData.constraints.approvalRequired ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 