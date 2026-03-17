import { useDinnerStore } from '../stores/dinnerStore';
import type { DayOfWeek, MemberId } from '../types';

export function useVote() {
  const castVote = useDinnerStore((s) => s.castVote);
  const vetoOption = useDinnerStore((s) => s.vetoOption);
  const vetoBudget = useDinnerStore((s) => s.vetoBudget);
  const currentUser = useDinnerStore((s) => s.currentUser);

  const vote = (dayId: DayOfWeek, optionId: string) => {
    castVote(dayId, optionId, currentUser);
  };

  const veto = (dayId: DayOfWeek, optionId: string) => {
    vetoOption(dayId, optionId, currentUser);
  };

  const canVeto = (memberId: MemberId) => vetoBudget[memberId] > 0;

  return { vote, veto, canVeto, currentUser, vetoBudget };
}
