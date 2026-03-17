import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import type { DayOfWeek, DayOption, MealHistoryEntry, MemberId, VetoBudget } from '../types';
import { DAY_ORDER } from '../types';

// ── Week ID helpers ──────────────────────────────────────────────────────
// WHY: We key weeks by ISO-week string (e.g. "2026-W12") so each Monday
// starts a clean voting slate and veto budgets can reset.

function getISOWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export const currentWeekId = () => getISOWeekId();

// ── Collection path helpers ──────────────────────────────────────────────

const FAMILY_ID = 'adler'; // WHY: Single-family app; hardcoded to avoid unnecessary complexity

function familyRef() {
  return doc(db!, 'families', FAMILY_ID);
}

function weekRef(weekId?: string) {
  return doc(db!, 'families', FAMILY_ID, 'weeks', weekId ?? currentWeekId());
}

function optionsCol(weekId?: string) {
  return collection(db!, 'families', FAMILY_ID, 'weeks', weekId ?? currentWeekId(), 'options');
}

function optionRef(optionId: string, weekId?: string) {
  return doc(db!, 'families', FAMILY_ID, 'weeks', weekId ?? currentWeekId(), 'options', optionId);
}

function historyCol() {
  return collection(db!, 'families', FAMILY_ID, 'history');
}

function historyRef(entryId: string) {
  return doc(db!, 'families', FAMILY_ID, 'history', entryId);
}

// ── Types for Firestore documents ────────────────────────────────────────

interface FamilyDoc {
  name: string;
  members: Record<MemberId, { name: string; emoji: string; isAdmin: boolean }>;
  vetoBudget: VetoBudget;
  vetoBudgetWeek: string; // Track which week the budget applies to
}

interface WeekDoc {
  days: Record<DayOfWeek, { settledMeal: string | null; settledAt: Timestamp | null }>;
}

interface OptionDoc {
  name: string;
  emoji: string;
  sub: string;
  type: 'cook' | 'order' | 'restaurant';
  dayId: DayOfWeek;
  votes: MemberId[];
  vetoBy: MemberId | null;
  addedBy: MemberId;
  lastHadDate: Timestamp | null;
}

interface HistoryDoc {
  meal: string;
  emoji: string;
  date: Timestamp;
  type: 'cook' | 'order' | 'restaurant';
}

// ── Initialization ───────────────────────────────────────────────────────

/** Create the family doc and current week doc if they don't exist yet. */
export async function initializeFamily(): Promise<void> {
  if (!hasFirebaseConfig || !db) return;

  const famSnap = await getDoc(familyRef());
  if (!famSnap.exists()) {
    const familyData: FamilyDoc = {
      name: 'Adler',
      members: {
        matt: { name: 'Matt', emoji: '👨', isAdmin: true },
        amanda: { name: 'Amanda', emoji: '👩', isAdmin: false },
        jaden: { name: 'Jaden', emoji: '👦', isAdmin: false },
        adalynn: { name: 'Adalynn', emoji: '👧', isAdmin: false },
      },
      vetoBudget: { matt: 1, amanda: 1, jaden: 1, adalynn: 1 },
      vetoBudgetWeek: currentWeekId(),
    };
    await setDoc(familyRef(), familyData);
  }

  const weekSnap = await getDoc(weekRef());
  if (!weekSnap.exists()) {
    const emptyDays: WeekDoc['days'] = {} as WeekDoc['days'];
    for (const d of DAY_ORDER) {
      emptyDays[d] = { settledMeal: null, settledAt: null };
    }
    await setDoc(weekRef(), { days: emptyDays });
  }

  // Reset veto budget if week has changed
  const famData = (await getDoc(familyRef())).data() as FamilyDoc | undefined;
  if (famData && famData.vetoBudgetWeek !== currentWeekId()) {
    await updateDoc(familyRef(), {
      vetoBudget: { matt: 1, amanda: 1, jaden: 1, adalynn: 1 },
      vetoBudgetWeek: currentWeekId(),
    });
  }
}

// ── Write operations ─────────────────────────────────────────────────────

export async function firestoreCastVote(
  optionId: string,
  memberId: MemberId,
  allOptions: DayOption[],
): Promise<void> {
  if (!hasFirebaseConfig || !db) return;

  // WHY: Remove vote from all other options for this day, then add to the target.
  // This ensures a member can only vote for one option at a time.
  for (const opt of allOptions) {
    if (opt.vetoBy) continue;
    if (opt.id === optionId) {
      if (!opt.votes.includes(memberId)) {
        await updateDoc(optionRef(optionId), { votes: arrayUnion(memberId) });
      }
    } else if (opt.votes.includes(memberId)) {
      await updateDoc(optionRef(opt.id), { votes: arrayRemove(memberId) });
    }
  }
}

export async function firestoreVetoOption(
  optionId: string,
  memberId: MemberId,
): Promise<void> {
  if (!hasFirebaseConfig || !db) return;

  await updateDoc(optionRef(optionId), {
    vetoBy: memberId,
    votes: arrayRemove(memberId),
  });
  await updateDoc(familyRef(), {
    [`vetoBudget.${memberId}`]: 0,
  });
}

export async function firestoreAddOption(
  dayId: DayOfWeek,
  option: DayOption,
): Promise<void> {
  if (!hasFirebaseConfig || !db) return;

  const optDoc: OptionDoc = {
    name: option.name,
    emoji: option.emoji,
    sub: option.sub,
    type: option.type,
    dayId,
    votes: [],
    vetoBy: null,
    addedBy: option.addedBy,
    lastHadDate: option.lastHadDate ? Timestamp.fromDate(option.lastHadDate) : null,
  };
  await setDoc(optionRef(option.id), optDoc);
}

export async function firestoreSettleMeal(
  dayId: DayOfWeek,
  mealName: string,
  emoji: string,
  type: DayOption['type'],
): Promise<void> {
  if (!hasFirebaseConfig || !db) return;

  const now = Timestamp.now();

  // Update the week doc with settled meal
  await updateDoc(weekRef(), {
    [`days.${dayId}.settledMeal`]: mealName,
    [`days.${dayId}.settledAt`]: now,
  });

  // Write to history (append-only)
  const entryId = `h-${Date.now()}`;
  const historyEntry: HistoryDoc = {
    meal: mealName,
    emoji,
    date: now,
    type,
  };
  await setDoc(historyRef(entryId), historyEntry);
}

// ── Real-time listeners ──────────────────────────────────────────────────

export interface FirestoreCallbacks {
  onFamilyUpdate: (vetoBudget: VetoBudget) => void;
  onWeekUpdate: (days: Record<DayOfWeek, { settledMeal: string | null; settledAt: Date | null }>) => void;
  onOptionsUpdate: (options: (DayOption & { dayId: DayOfWeek })[]) => void;
  onHistoryUpdate: (history: MealHistoryEntry[]) => void;
}

/** Subscribe to all Firestore collections. Returns an unsubscribe function. */
export function subscribeToFirestore(callbacks: FirestoreCallbacks): Unsubscribe {
  if (!hasFirebaseConfig || !db) return () => {};

  const unsubs: Unsubscribe[] = [];

  // 1. Family doc → veto budget
  unsubs.push(
    onSnapshot(familyRef(), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as FamilyDoc;
      callbacks.onFamilyUpdate(data.vetoBudget);
    })
  );

  // 2. Week doc → settled meals
  unsubs.push(
    onSnapshot(weekRef(), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as WeekDoc;
      const days: Record<string, { settledMeal: string | null; settledAt: Date | null }> = {};
      for (const [dayId, dayData] of Object.entries(data.days)) {
        days[dayId] = {
          settledMeal: dayData.settledMeal,
          settledAt: dayData.settledAt?.toDate() ?? null,
        };
      }
      callbacks.onWeekUpdate(days as Record<DayOfWeek, { settledMeal: string | null; settledAt: Date | null }>);
    })
  );

  // 3. Options collection → all options for the week
  unsubs.push(
    onSnapshot(optionsCol(), (snap) => {
      const options: (DayOption & { dayId: DayOfWeek })[] = snap.docs.map((d) => {
        const data = d.data() as OptionDoc;
        return {
          id: d.id,
          name: data.name,
          emoji: data.emoji,
          sub: data.sub,
          type: data.type,
          dayId: data.dayId,
          votes: data.votes ?? [],
          vetoBy: data.vetoBy,
          addedBy: data.addedBy,
          lastHadDate: data.lastHadDate?.toDate() ?? null,
        };
      });
      callbacks.onOptionsUpdate(options);
    })
  );

  // 4. History collection → meal history
  unsubs.push(
    onSnapshot(query(historyCol(), orderBy('date', 'desc')), (snap) => {
      const history: MealHistoryEntry[] = snap.docs.map((d) => {
        const data = d.data() as HistoryDoc;
        return {
          id: d.id,
          meal: data.meal,
          emoji: data.emoji,
          date: data.date.toDate(),
          type: data.type,
        };
      });
      callbacks.onHistoryUpdate(history);
    })
  );

  // Return a single unsub that tears down everything
  return () => unsubs.forEach((fn) => fn());
}
