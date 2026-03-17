import { useDinnerStore, getConsensus } from '../stores/dinnerStore';
import { isWeekend } from '../types';

export function useDay() {
  const activeDay = useDinnerStore((s) => s.activeDay);
  const dayStatus = useDinnerStore((s) => s.days[s.activeDay]);
  const setActiveDay = useDinnerStore((s) => s.setActiveDay);

  const weekend = isWeekend(activeDay);
  const consensus = getConsensus(dayStatus.options);

  return {
    activeDay,
    dayStatus,
    setActiveDay,
    isWeekend: weekend,
    consensus,
  };
}
