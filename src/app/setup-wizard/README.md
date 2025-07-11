# PlanD School Setup Wizard

This folder contains the multi-step setup wizard for new school administrators. Each step is implemented as a separate component, with shared context, validation, and types for robust state management and extensibility.

- `index.tsx`: Main wizard entry and step router
- `Step1SchoolInfo.tsx`: School information form
- `Step2Schedule.tsx`: Schedule configuration form
- `Step3StaffUpload.tsx`: Staff data upload and preview
- `Step4Substitutes.tsx`: Substitute pool setup
- `Step5CoverageRules.tsx`: Coverage rules and constraints
- `ProgressBar.tsx`: Progress indicator UI
- `WizardContext.tsx`: State management context/provider
- `validation.ts`: Validation helpers for all steps
- `types.ts`: TypeScript types for wizard data 