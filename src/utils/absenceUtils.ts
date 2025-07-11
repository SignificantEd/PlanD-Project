import type { IAbsence } from '../types/interfaces';

export function sortAbsencesByPriority(absences: IAbsence[]): IAbsence[] {
  return [...absences].sort((a, b) => {
    // Para absences have highest priority (lowest number)
    if (a.type === 'Para' && b.type !== 'Para') return -1;
    if (b.type === 'Para' && a.type !== 'Para') return 1;
    
    // Full Day absences have second priority
    if (a.type === 'Full Day' && b.type !== 'Full Day') return -1;
    if (b.type === 'Full Day' && a.type !== 'Full Day') return 1;
    
    // Half Day AM/PM have third priority
    if ((a.type === 'Half Day AM' || a.type === 'Half Day PM') && 
        (b.type !== 'Half Day AM' && b.type !== 'Half Day PM')) return -1;
    if ((b.type === 'Half Day AM' || b.type === 'Half Day PM') && 
        (a.type !== 'Half Day AM' && a.type !== 'Half Day PM')) return 1;
    
    // Custom absences have lowest priority
    if (a.type === 'Custom' && b.type !== 'Custom') return 1;
    if (b.type === 'Custom' && a.type !== 'Custom') return -1;
    
    // If types are the same, sort by date (earlier dates first)
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
} 