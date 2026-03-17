import { useDinnerStore } from '../stores/dinnerStore';
import { useHistory } from '../hooks/useHistory';
import { DAY_ORDER, DAY_LABELS, isWeekend as isWeekendDay } from '../types';
import { useNavigate } from 'react-router-dom';

export function WeekPage() {
  const days = useDinnerStore((s) => s.days);
  const setActiveDay = useDinnerStore((s) => s.setActiveDay);
  const { isRepeated } = useHistory();
  const navigate = useNavigate();

  function handleDayClick(dayId: typeof DAY_ORDER[number]) {
    setActiveDay(dayId);
    navigate('/');
  }

  function getDayEmoji(dayId: typeof DAY_ORDER[number]): string {
    const day = days[dayId];
    if (day.settledMeal) return '✅';
    if (isWeekendDay(dayId)) return '🍽';
    if (day.options.length > 0) return '🗳';
    return '❓';
  }

  function getDayStatus(dayId: typeof DAY_ORDER[number]): string {
    const day = days[dayId];
    if (day.settledMeal) return day.settledMeal;
    if (day.options.length > 0) return `${day.options.length} options`;
    return 'No options yet';
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">This Week</h1>
        <p className="text-sm text-gray-500">Overview of all meals</p>
      </div>

      <div className="flex-1 px-4 py-4 pb-20 space-y-2">
        {DAY_ORDER.map((dayId) => {
          const day = days[dayId];
          const weekend = isWeekendDay(dayId);
          const decided = !!day.settledMeal;
          const repeated = decided && isRepeated(day.settledMeal!);

          return (
            <button
              key={dayId}
              onClick={() => handleDayClick(dayId)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border bg-white transition-shadow hover:shadow-md text-left
                ${weekend ? 'border-weekend-border' : 'border-gray-200'}`}
            >
              {/* Status emoji */}
              <span className="text-2xl shrink-0">{getDayEmoji(dayId)}</span>

              {/* Day name + meal info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${weekend ? 'text-weekend-dark' : 'text-gray-900'}`}>
                    {DAY_LABELS[dayId]}
                  </span>
                  {weekend && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-weekend-light text-weekend-dark">
                      Weekend
                    </span>
                  )}
                  {decided && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">
                      Decided
                    </span>
                  )}
                  {repeated && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      Repeated
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 truncate block">
                  {getDayStatus(dayId)}
                </span>
              </div>

              {/* Chevron */}
              <span className="text-gray-300 shrink-0">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
