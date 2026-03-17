import type { DayOption, MemberId } from '../types';
import { FAMILY_MEMBERS, getMember } from '../types';

interface OptionCardProps {
  option: DayOption;
  isWeekend: boolean;
  onVote: () => void;
  onVeto: () => void;
  canVeto: boolean;
  lastHadLabel: { text: string; severity: 'warn' | 'subtle' | null };
}

export function OptionCard({
  option,
  isWeekend,
  onVote,
  onVeto,
  canVeto,
  lastHadLabel,
}: OptionCardProps) {
  const isVetoed = option.vetoBy !== null;
  const vetoerName = isVetoed ? getMember(option.vetoBy as MemberId).name : null;

  // WHY: Weekend days use blue accent; weekday meals use green — matches the
  // CalendarStrip color scheme so the card visually belongs to its day type.
  const accentBorder = isWeekend ? 'border-weekend-border' : 'border-primary-border';
  const baseBorder = isVetoed ? 'border-gray-200' : accentBorder;

  return (
    <div
      className={[
        'bg-white border rounded-xl p-4 flex flex-col gap-2',
        baseBorder,
        isVetoed
          ? 'opacity-60 cursor-default'
          : 'cursor-pointer hover:shadow-md transition-shadow duration-150',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={isVetoed ? undefined : onVote}
      role={isVetoed ? undefined : 'button'}
      tabIndex={isVetoed ? undefined : 0}
      onKeyDown={
        isVetoed
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onVote();
              }
            }
      }
    >
      {/* Row 1: Emoji + meal name + subtitle */}
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{option.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-lg leading-tight block truncate">
            {option.name}
          </span>
          <span className="text-sm text-gray-500 block truncate">{option.sub}</span>
        </div>

        {/* Vetoed badge — shown inline at the right of the header row */}
        {isVetoed && (
          <span className="ml-auto shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border bg-veto-bg text-veto-text border-veto-border whitespace-nowrap">
            Vetoed by {vetoerName}
          </span>
        )}
      </div>

      {/* Row 2: "Last had" recency label */}
      {lastHadLabel.severity !== null && (
        <p
          className={[
            'text-xs font-medium',
            lastHadLabel.severity === 'warn' ? 'text-orange-500' : 'text-gray-400',
          ].join(' ')}
        >
          {lastHadLabel.text}
        </p>
      )}

      {/* Row 3: Vote pips — one dot per family member */}
      <div className="flex items-center gap-3">
        {FAMILY_MEMBERS.map((member) => {
          const hasVoted = option.votes.includes(member.id);
          return (
            <div key={member.id} className="flex flex-col items-center gap-0.5">
              {/* Dot */}
              <div
                className="w-3 h-3 rounded-full"
                style={
                  hasVoted
                    ? { backgroundColor: member.color.bg, border: `2px solid ${member.color.text}` }
                    : { backgroundColor: '#E5E7EB' /* gray-200 */ }
                }
                aria-label={hasVoted ? `${member.name} voted` : `${member.name} hasn't voted`}
              />
              {/* Initial */}
              <span className="text-[9px] leading-none text-gray-400 font-medium">
                {member.name[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 4: Veto button — only when the option is not already vetoed and caller grants permission */}
      {canVeto && !isVetoed && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              // WHY: Stop propagation so the veto click doesn't also trigger the card's onVote
              e.stopPropagation();
              onVeto();
            }}
            className="text-xs font-medium px-3 py-1 rounded-lg border bg-veto-bg text-veto-text border-veto-border hover:brightness-95 transition-all duration-100"
          >
            Veto
          </button>
        </div>
      )}
    </div>
  );
}
