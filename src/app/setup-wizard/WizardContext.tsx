import { createContext } from "react";

export const WizardContext = createContext(null);

export default function WizardProvider({ children }: { children: React.ReactNode }) {
  // Placeholder for wizard state logic
  return <WizardContext.Provider value={null}>{children}</WizardContext.Provider>;
} 