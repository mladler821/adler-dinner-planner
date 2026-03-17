export type MealType = 'cook' | 'order' | 'restaurant';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type MemberId = 'matt' | 'amanda' | 'jaden' | 'adalynn';

export interface FamilyMember {
  id: MemberId;
  name: string;
  emoji: string;
  isAdmin: boolean;
  color: {
    bg: string;
    text: string;
  };
}

export interface DayOption {
  id: string;
  name: string;
  emoji: string;
  sub: string;
  type: MealType;
  votes: MemberId[];
  vetoBy: MemberId | null;
  addedBy: MemberId;
  lastHadDate: Date | null;
}

export interface MealHistoryEntry {
  id: string;
  meal: string;
  emoji: string;
  date: Date;
  type: MealType;
}

export interface DayStatus {
  dayId: DayOfWeek;
  options: DayOption[];
  settledMeal: string | null;
  settledAt: Date | null;
}

export interface VetoBudget {
  matt: number;   // 1 = available, 0 = used
  amanda: number;
  jaden: number;
  adalynn: number;
}

export interface RecipeSuggestion {
  name: string;
  emoji: string;
  tag: string;
  cookTime: string;
  servings: number;
  brief: string;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKEND_DAYS: DayOfWeek[] = ['sat', 'sun'];

export function isWeekend(day: DayOfWeek): boolean {
  return WEEKEND_DAYS.includes(day);
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'matt', name: 'Matt', emoji: '👨', isAdmin: true, color: { bg: '#E6F1FB', text: '#0C447C' } },
  { id: 'amanda', name: 'Amanda', emoji: '👩', isAdmin: false, color: { bg: '#FBEAF0', text: '#72243E' } },
  { id: 'jaden', name: 'Jaden', emoji: '👦', isAdmin: false, color: { bg: '#FAEEDA', text: '#633806' } },
  { id: 'adalynn', name: 'Adalynn', emoji: '👧', isAdmin: false, color: { bg: '#EEEDFE', text: '#3C3489' } },
];

export function getMember(id: MemberId): FamilyMember {
  return FAMILY_MEMBERS.find(m => m.id === id)!;
}
