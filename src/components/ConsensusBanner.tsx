interface ConsensusBannerProps {
  status: 'consensus' | 'tie' | 'voting' | 'no-options';
  winner: { name: string; emoji: string } | null;
  tied: { name: string; emoji: string }[];
  isWeekend: boolean;
  onSettle?: () => void;
}

export function ConsensusBanner({
  status,
  winner,
  tied,
  isWeekend,
  onSettle,
}: ConsensusBannerProps) {
  if (status === 'consensus' && winner) {
    // WHY: Weekend days use blue theme to visually distinguish them from
    // weekday cooking (teal/green) — matches the rest of the app's color system.
    const surfaceCls = isWeekend
      ? 'bg-weekend-light border-weekend-border'
      : 'bg-primary-light border-primary-border';

    const buttonCls = isWeekend
      ? 'bg-weekend text-white hover:opacity-90'
      : 'bg-primary text-white hover:opacity-90';

    return (
      <div
        className={`rounded-xl p-4 border shadow-sm ${surfaceCls}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true">✅</span>
          <h2 className="font-semibold text-base">It's decided!</h2>
        </div>

        <p className="text-3xl font-bold mb-3">
          {winner.emoji} {winner.name}
        </p>

        <button
          onClick={onSettle}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-opacity ${buttonCls}`}
        >
          Lock it in
        </button>
      </div>
    );
  }

  if (status === 'tie' && tied.length > 0) {
    return (
      <div
        className="rounded-xl p-4 border shadow-sm"
        style={{ backgroundColor: '#FEF3CD', borderColor: '#FFE69C' }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true">⚖️</span>
          <h2 className="font-semibold text-base">It's a tie!</h2>
        </div>

        <ul className="flex flex-wrap gap-2 mb-3">
          {tied.map((option) => (
            <li
              key={option.name}
              className="text-lg font-medium"
            >
              {option.emoji} {option.name}
            </li>
          ))}
        </ul>

        <p className="text-sm text-amber-800">Someone needs to break the tie!</p>
      </div>
    );
  }

  // 'voting' and 'no-options' statuses render nothing
  return null;
}
