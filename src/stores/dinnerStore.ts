import { create } from 'zustand';
import type { DayOfWeek, DayOption, DayStatus, MealHistoryEntry, MemberId, VetoBudget } from '../types';
import { DAY_ORDER, FAMILY_MEMBERS } from '../types';
import {
  firestoreCastVote,
  firestoreVetoOption,
  firestoreAddOption,
  firestoreSettleMeal,
} from '../lib/firestore';

interface DinnerState {
  activeDay: DayOfWeek;
  days: Record<DayOfWeek, DayStatus>;
  vetoBudget: VetoBudget;
  history: MealHistoryEntry[];
  currentUser: MemberId;

  // Actions
  setActiveDay: (day: DayOfWeek) => void;
  setCurrentUser: (user: MemberId) => void;
  castVote: (dayId: DayOfWeek, optionId: string, memberId: MemberId) => void;
  vetoOption: (dayId: DayOfWeek, optionId: string, memberId: MemberId) => void;
  addOption: (dayId: DayOfWeek, option: DayOption) => void;
  settleMeal: (dayId: DayOfWeek, mealName: string, emoji: string, type: DayOption['type']) => void;
  getLastHadDays: (mealName: string) => number | null;
}

function getTodayDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay();
  // WHY: JS getDay() returns 0=Sun, we need mon-based index for our DAY_ORDER array
  const mapping: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return mapping[jsDay];
}

function daysAgo(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function createSeedHistory(): MealHistoryEntry[] {
  const today = new Date();
  return [
    {
      id: 'h1',
      meal: 'Pasta Carbonara',
      emoji: '🍝',
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (Monday)
      type: 'cook',
    },
    {
      id: 'h2',
      meal: 'Grilled Chicken',
      emoji: '🍗',
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (Tuesday)
      type: 'cook',
    },
    {
      id: 'h3',
      meal: 'Tacos',
      emoji: '🌮',
      date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      type: 'cook',
    },
    {
      id: 'h4',
      meal: 'Olive Garden',
      emoji: '🫒',
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (last Saturday)
      type: 'restaurant',
    },
  ];
}

function createSeedDays(): Record<DayOfWeek, DayStatus> {
  const emptyDay = (dayId: DayOfWeek): DayStatus => ({
    dayId,
    options: [],
    settledMeal: null,
    settledAt: null,
  });

  const days: Record<DayOfWeek, DayStatus> = {} as Record<DayOfWeek, DayStatus>;
  for (const d of DAY_ORDER) {
    days[d] = emptyDay(d);
  }

  // Monday — settled
  days.mon.settledMeal = 'Pasta Carbonara';
  days.mon.settledAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  // Tuesday — settled
  days.tue.settledMeal = 'Grilled Chicken';
  days.tue.settledAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  // Wednesday — active voting with seed data per spec
  days.wed.options = [
    {
      id: 'opt-tacos',
      name: 'Tacos',
      emoji: '🌮',
      sub: 'Cook at home · 30 min',
      type: 'cook',
      votes: ['matt', 'jaden'],
      vetoBy: null,
      addedBy: 'matt',
      lastHadDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'opt-stirfry',
      name: 'Stir-fry',
      emoji: '🥘',
      sub: 'Cook at home · 25 min',
      type: 'cook',
      votes: ['amanda'],
      vetoBy: null,
      addedBy: 'amanda',
      lastHadDate: null,
    },
    {
      id: 'opt-pizza',
      name: 'Pizza',
      emoji: '🍕',
      sub: 'Delivery · ~45 min',
      type: 'order',
      votes: [],
      vetoBy: 'amanda',
      addedBy: 'jaden',
      lastHadDate: null,
    },
    {
      id: 'opt-burgers',
      name: 'Burgers',
      emoji: '🍔',
      sub: 'Cook at home · 35 min',
      type: 'cook',
      votes: [],
      vetoBy: null,
      addedBy: 'jaden',
      lastHadDate: null,
    },
  ];

  // Thursday — a couple options but no votes yet
  days.thu.options = [
    {
      id: 'opt-salmon',
      name: 'Salmon',
      emoji: '🐟',
      sub: 'Cook at home · 25 min',
      type: 'cook',
      votes: [],
      vetoBy: null,
      addedBy: 'matt',
      lastHadDate: null,
    },
    {
      id: 'opt-soup',
      name: 'Chicken Soup',
      emoji: '🍲',
      sub: 'Cook at home · 40 min',
      type: 'cook',
      votes: [],
      vetoBy: null,
      addedBy: 'amanda',
      lastHadDate: null,
    },
  ];

  // Saturday — restaurant mode
  days.sat.options = [
    {
      id: 'opt-chipotle',
      name: 'Chipotle',
      emoji: '🌯',
      sub: 'Mexican · Fast Casual',
      type: 'restaurant',
      votes: ['jaden'],
      vetoBy: null,
      addedBy: 'jaden',
      lastHadDate: null,
    },
    {
      id: 'opt-olivegarden',
      name: 'Olive Garden',
      emoji: '🫒',
      sub: 'Italian · Casual Dining',
      type: 'restaurant',
      votes: ['amanda'],
      vetoBy: null,
      addedBy: 'amanda',
      lastHadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'opt-sushi',
      name: 'Sushi Palace',
      emoji: '🍣',
      sub: 'Japanese · Casual Dining',
      type: 'restaurant',
      votes: ['matt'],
      vetoBy: null,
      addedBy: 'matt',
      lastHadDate: null,
    },
  ];

  return days;
}

export const useDinnerStore = create<DinnerState>((set, get) => ({
  activeDay: getTodayDayOfWeek(),
  days: createSeedDays(),
  vetoBudget: { matt: 1, amanda: 0, jaden: 1, adalynn: 1 }, // Amanda already used her veto on Pizza
  history: createSeedHistory(),
  currentUser: 'matt',

  setActiveDay: (day) => set({ activeDay: day }),

  setCurrentUser: (user) => set({ currentUser: user }),

  castVote: (dayId, optionId, memberId) => {
    const state = get();
    const day = state.days[dayId];

    // WHY: Fire-and-forget Firestore write; the onSnapshot listener will
    // reconcile the store once the server confirms.
    firestoreCastVote(optionId, memberId, day.options);

    set(() => {
      const newOptions = day.options.map((opt) => {
        if (opt.vetoBy) return opt;
        if (opt.id === optionId) {
          if (opt.votes.includes(memberId)) return opt;
          return { ...opt, votes: [...opt.votes, memberId] };
        }
        return { ...opt, votes: opt.votes.filter((v) => v !== memberId) };
      });

      return {
        days: {
          ...state.days,
          [dayId]: { ...day, options: newOptions },
        },
      };
    });
  },

  vetoOption: (dayId, optionId, memberId) => {
    const state = get();
    if (state.vetoBudget[memberId] === 0) return;

    firestoreVetoOption(optionId, memberId);

    const day = state.days[dayId];
    const newOptions = day.options.map((opt) => {
      if (opt.id !== optionId) return opt;
      return {
        ...opt,
        vetoBy: memberId,
        votes: opt.votes.filter((v) => v !== memberId),
      };
    });

    set({
      days: {
        ...state.days,
        [dayId]: { ...day, options: newOptions },
      },
      vetoBudget: {
        ...state.vetoBudget,
        [memberId]: 0,
      },
    });
  },

  addOption: (dayId, option) => {
    firestoreAddOption(dayId, option);

    set((state) => {
      const day = state.days[dayId];
      return {
        days: {
          ...state.days,
          [dayId]: { ...day, options: [...day.options, option] },
        },
      };
    });
  },

  settleMeal: (dayId, mealName, emoji, type) => {
    firestoreSettleMeal(dayId, mealName, emoji, type);

    set((state) => {
      const now = new Date();
      const newHistoryEntry: MealHistoryEntry = {
        id: `h-${Date.now()}`,
        meal: mealName,
        emoji,
        date: now,
        type,
      };

      return {
        days: {
          ...state.days,
          [dayId]: {
            ...state.days[dayId],
            settledMeal: mealName,
            settledAt: now,
          },
        },
        history: [...state.history, newHistoryEntry],
      };
    });
  },

  getLastHadDays: (mealName) => {
    const { history } = get();
    const entry = history
      .filter((h) => h.meal.toLowerCase() === mealName.toLowerCase())
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    if (!entry) return null;
    return daysAgo(entry.date);
  },
}));

// Helper to determine consensus
export function getConsensus(options: DayOption[]): {
  status: 'consensus' | 'tie' | 'voting' | 'no-options';
  winner: DayOption | null;
  tied: DayOption[];
} {
  const activeOptions = options.filter((o) => !o.vetoBy);
  if (activeOptions.length === 0) {
    return { status: 'no-options', winner: null, tied: [] };
  }

  const totalMembers = FAMILY_MEMBERS.length;
  const allVoted = activeOptions.reduce((sum, o) => sum + o.votes.length, 0) >= totalMembers;

  if (!allVoted) {
    return { status: 'voting', winner: null, tied: [] };
  }

  // Find the option(s) with most votes
  const maxVotes = Math.max(...activeOptions.map((o) => o.votes.length));
  const topOptions = activeOptions.filter((o) => o.votes.length === maxVotes);

  if (topOptions.length === 1) {
    return { status: 'consensus', winner: topOptions[0], tied: [] };
  }

  return { status: 'tie', winner: null, tied: topOptions };
}
