import { useDinnerStore } from '../stores/dinnerStore';
import { FAMILY_MEMBERS } from '../types';

export function useFamily() {
  const currentUser = useDinnerStore((s) => s.currentUser);
  const setCurrentUser = useDinnerStore((s) => s.setCurrentUser);
  const vetoBudget = useDinnerStore((s) => s.vetoBudget);

  const currentMember = FAMILY_MEMBERS.find((m) => m.id === currentUser)!;

  return {
    members: FAMILY_MEMBERS,
    currentUser,
    currentMember,
    setCurrentUser,
    vetoBudget,
  };
}
