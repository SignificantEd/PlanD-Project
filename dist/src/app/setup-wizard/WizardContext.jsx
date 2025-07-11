import { createContext } from "react";
export const WizardContext = createContext(null);
export default function WizardProvider({ children }) {
    // Placeholder for wizard state logic
    return <WizardContext.Provider value={{}}>{children}</WizardContext.Provider>;
}
