import { type DayOfWeek, DAY_ORDER, DAY_LABELS, isWeekend } from '../types';
import { useDay } from '../hooks/useDay';
import { useDinnerStore } from '../stores/dinnerStore';

// Derive the status emoji and short label for a given day pill.
// Priority: settled meal > weekend-open > weekday-voting > unknown.
function getDayDisplay(
  day: DayOfWeek,
  settledMeal: string | null,
  options: { votes: string[] }[],
): { emoji: string; label: string } {
  if (settledMeal) {
    return { emoji: '✅', label: settledMeal };
  }

  const hasOptions = options.length > 0;
  const hasVotes = options.some((o) => o.votes.length > 0);

  if (isWeekend(day) && hasOptions) {
    // Weekend days show a restaurant-style indicator when options exist,
    // regardless of vote state, since weekend dining is more exploratory.
    return { emoji: '🍽', label: 'Open' };
  }

  if (hasVotes) {
    return { emoji: '🗳', label: 'Voting' };
  }

  if (hasOptions) {
    // Options exist but no votes cast yet — still in nomination phase.
    return { emoji: '🗳', label: 'Voting' };
  }

  return { emoji: '❓', label: 'TBD' };
}

export function CalendarStrip() {
  const { activeDay, setActiveDay } = useDay();
  const days = useDinnerStore((s) => s.days);

  return (
    // White bar with a subtle bottom shadow to visually separate the strip
    // from the content below. overflow-x-auto ensures the 7 pills remain
    // fully accessible on very narrow viewports without wrapping.
    <div className="bg-white shadow-sm overflow-x-auto">
      <div className="flex min-w-max px-2 py-2 gap-1.5">
        {DAY_ORDER.map((day) => {
          const dayStatus = days[day];
          const active = day === activeDay;
          const weekend = isWeekend(day);
          const { emoji, label } = getDayDisplay(
            day,
            dayStatus.settledMeal,
            dayStatus.options,
          );

          // Build the pill's class list based on active state and day type.
          // Active pills get a colored 2px border and a raised shadow to
          // indicate the current selection. Inactive pills use a neutral
          // gray border so they recede visually.
          let pillClasses =
            'flex flex-col items-center justify-center flex-1 min-w-[44px] rounded-xl px-1.5 py-2 cursor-pointer select-none transition-all duration-150 ';

          if (active) {
            if (weekend) {
              pillClasses +=
                'bg-weekend-light border-2 border-weekend-border text-weekend-dark shadow-md';
            } else {
              pillClasses +=
                'bg-primary-light border-2 border-primary-border text-primary-dark shadow-md';
            }
          } else {
            pillClasses +=
              'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50';
          }

          return (
            <button
              key={day}
              className={pillClasses}
              onClick={() => setActiveDay(day)}
              aria-pressed={active}
              aria-label={`${DAY_LABELS[day]}: ${label}`}
            >
              {/* Day abbreviation — prominent on active, muted otherwise */}
              <span className="text-xs font-semibold leading-none mb-1">
                {DAY_LABELS[day]}
              </span>

              {/* Status emoji gives an at-a-glance meal state */}
              <span className="text-base leading-none mb-1">{emoji}</span>

              {/* Short label truncated so it never breaks the pill layout */}
              <span className="text-[10px] font-medium leading-none truncate max-w-full">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
