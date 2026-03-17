import { useDinnerStore } from '../stores/dinnerStore';

export function useHistory() {
  const history = useDinnerStore((s) => s.history);
  const getLastHadDays = useDinnerStore((s) => s.getLastHadDays);

  function getLastHadLabel(mealName: string): { text: string; severity: 'warn' | 'subtle' | null } {
    const days = getLastHadDays(mealName);
    if (days === null || days > 14) return { text: '', severity: null };
    if (days < 7) return { text: `⚠ Had ${days} day${days === 1 ? '' : 's'} ago`, severity: 'warn' };
    return { text: `Last had ${days} days ago`, severity: 'subtle' };
  }

  // Check if a meal was had within the last 7 days (for "repeated" badge in week view)
  function isRepeated(mealName: string): boolean {
    const days = getLastHadDays(mealName);
    return days !== null && days < 7;
  }

  return { history, getLastHadDays, getLastHadLabel, isRepeated };
}
