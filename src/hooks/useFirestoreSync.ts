import { useEffect, useRef } from 'react';
import { hasFirebaseConfig } from '../lib/firebase';
import { subscribeToFirestore, initializeFamily } from '../lib/firestore';
import { useDinnerStore } from '../stores/dinnerStore';
import type { DayOfWeek, DayOption } from '../types';
import { DAY_ORDER } from '../types';

/**
 * When Firebase is configured, this hook:
 * 1. Initializes the family/week documents if needed
 * 2. Subscribes to Firestore onSnapshot listeners
 * 3. Pushes real-time updates into the Zustand store
 *
 * In demo mode (no Firebase config), this is a no-op.
 */
export function useFirestoreSync() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!hasFirebaseConfig || initialized.current) return;
    initialized.current = true;

    let unsubscribe: (() => void) | null = null;

    async function setup() {
      try {
        // Ensure family and week docs exist
        await initializeFamily();

        // Subscribe to real-time updates
        unsubscribe = subscribeToFirestore({
        onFamilyUpdate: (vetoBudget) => {
          useDinnerStore.setState({ vetoBudget });
        },

        onWeekUpdate: (daysData) => {
          useDinnerStore.setState((state) => {
            const newDays = { ...state.days };
            for (const dayId of DAY_ORDER) {
              const incoming = daysData[dayId];
              if (incoming) {
                newDays[dayId] = {
                  ...newDays[dayId],
                  settledMeal: incoming.settledMeal,
                  settledAt: incoming.settledAt,
                };
              }
            }
            return { days: newDays };
          });
        },

        onOptionsUpdate: (options) => {
          useDinnerStore.setState((state) => {
            // Group options by day
            const optionsByDay: Record<DayOfWeek, DayOption[]> = {} as Record<DayOfWeek, DayOption[]>;
            for (const d of DAY_ORDER) {
              optionsByDay[d] = [];
            }
            for (const opt of options) {
              const { dayId, ...rest } = opt;
              if (optionsByDay[dayId]) {
                optionsByDay[dayId].push(rest);
              }
            }

            const newDays = { ...state.days };
            for (const dayId of DAY_ORDER) {
              newDays[dayId] = {
                ...newDays[dayId],
                options: optionsByDay[dayId],
              };
            }
            return { days: newDays };
          });
        },

        onHistoryUpdate: (history) => {
          useDinnerStore.setState({ history });
        },
      });
      } catch (err) {
        // WHY: Don't let Firestore failures crash the app — it should
        // degrade gracefully to local-only mode.
        console.error('[FirestoreSync] Failed to connect:', err);
      }
    }

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
}
