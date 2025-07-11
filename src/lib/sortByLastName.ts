export function sortByLastName<T extends { name: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const lastA = a.name.trim().split(' ').pop()?.toLowerCase() || '';
    const lastB = b.name.trim().split(' ').pop()?.toLowerCase() || '';
    return lastA.localeCompare(lastB);
  });
} 