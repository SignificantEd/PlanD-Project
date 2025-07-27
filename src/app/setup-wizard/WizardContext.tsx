import { createContext, useContext } from "react";

interface WizardContextType {
  wizardData: any;
  updateStepData: (step: number, data: any) => void;
  currentStep: number;
}

export const WizardContext = createContext<WizardContextType | null>(null);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

interface WizardProviderProps {
  children: React.ReactNode;
  value: WizardContextType;
}

export default function WizardProvider({ children, value }: WizardProviderProps) {
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
} 