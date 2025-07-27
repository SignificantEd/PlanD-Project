'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WizardProvider from './WizardContext';
import ProgressBar from './ProgressBar';
import Step1SchoolInfo from './Step1SchoolInfo';
import Step2Schedule from './Step2Schedule';
import Step3StaffUpload from './Step3StaffUpload';
import Step4Substitutes from './Step4Substitutes';
import Step5CoverageRules from './Step5CoverageRules';
import { validateStep } from './validation';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function SetupWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [wizardData, setWizardData] = useState({
    schoolInfo: {},
    scheduleConfig: {},
    staffUpload: {},
    substitutePool: {},
    coverageRules: {}
  });
  const router = useRouter();

  const steps = [
    { id: 1, name: 'School Information', component: Step1SchoolInfo },
    { id: 2, name: 'Schedule Configuration', component: Step2Schedule },
    { id: 3, name: 'Staff Data Upload', component: Step3StaffUpload },
    { id: 4, name: 'Substitute Pool Setup', component: Step4Substitutes },
    { id: 5, name: 'Coverage Rules', component: Step5CoverageRules }
  ];

  const updateStepData = (step: number, data: any) => {
    const stepKeys = ['', 'schoolInfo', 'scheduleConfig', 'staffUpload', 'substitutePool', 'coverageRules'];
    setWizardData(prev => ({
      ...prev,
      [stepKeys[step]]: data
    }));
  };

  const handleNext = async () => {
    setErrors([]);
    
    // Validate current step
    const stepKeys = ['', 'schoolInfo', 'scheduleConfig', 'staffUpload', 'substitutePool', 'coverageRules'];
    const currentStepData = wizardData[stepKeys[currentStep] as keyof typeof wizardData];
    const validation = validateStep(currentStep, currentStepData);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit all data
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/setup-wizard/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('School setup completed successfully! Redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        setErrors([error.message || 'Setup failed. Please try again.']);
      }
    } catch (error) {
      console.error('Setup submission error:', error);
      setErrors(['Network error. Please check your connection and try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component;

  return (
    <WizardProvider value={{ wizardData, updateStepData, currentStep }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img 
                    src="/significant-logo.png" 
                    alt="Significant Consulting Logo" 
                    className="h-10 w-10"
                  />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">PlanD School Setup Wizard</h1>
                  <p className="text-sm text-gray-600">Configure your school for automated coverage management</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={5} steps={steps} />

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
              </div>
              <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Current Step Content */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Step {currentStep}: {steps.find(step => step.id === currentStep)?.name}
              </h2>
              <div className="mt-2 h-1 bg-gray-200 rounded">
                <div 
                  className="h-1 bg-indigo-600 rounded transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {CurrentStepComponent && <CurrentStepComponent />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of 5
            </div>

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentStep === 5 ? 'Setting up...' : 'Processing...'}
                </div>
              ) : (
                <>
                  {currentStep === 5 ? 'Complete Setup' : 'Next'}
                  {currentStep < 5 && <ChevronRightIcon className="h-4 w-4 ml-1" />}
                  {currentStep === 5 && <CheckCircleIcon className="h-4 w-4 ml-1" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </WizardProvider>
  );
}
