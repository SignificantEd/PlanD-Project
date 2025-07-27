import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  name: string;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
}

export default function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={stepIdx !== steps.length - 1 ? 'flex-1' : ''}>
              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  {step.id < currentStep ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                  ) : step.id === currentStep ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                      <span className="text-white text-sm font-medium">{step.id}</span>
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                      <span className="text-gray-500 text-sm font-medium">{step.id}</span>
                    </div>
                  )}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <span className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="ml-3 hidden sm:block flex-1">
                    <div className={`h-0.5 w-full ${
                      step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}; 