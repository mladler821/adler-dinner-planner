import { FAMILY_MEMBERS, type DayOption, type MemberId, getMember } from '../types';
import { useDinnerStore } from '../stores/dinnerStore';

interface VoterPanelProps {
  options: DayOption[];
  isWeekend: boolean;
  vetoBudget: Record<MemberId, number>;
}

// Tailwind v4 @theme classes for each member's avatar background and text
const MEMBER_AVATAR_CLASSES: Record<MemberId, { bg: string; text: string }> = {
  matt:    { bg: 'bg-matt-bg',    text: 'text-matt-text' },
  amanda:  { bg: 'bg-amanda-bg',  text: 'text-amanda-text' },
  jaden:   { bg: 'bg-jaden-bg',   text: 'text-jaden-text' },
  adalynn: { bg: 'bg-adalynn-bg', text: 'text-adalynn-text' },
};

export function VoterPanel({ options, isWeekend, vetoBudget }: VoterPanelProps) {
  // WHY: Read currentUser from store so the panel can highlight the active user
  // in future iterations; imported here for potential extension without changing props.
  useDinnerStore((s) => s.currentUser);

  // Build a lookup: memberId → the option they voted for (if any)
  const voteMap = new Map<MemberId, DayOption>();
  for (const option of options) {
    for (const voterId of option.votes) {
      voteMap.set(voterId, option);
    }
  }

  // Build a lookup: memberId → the option they vetoed (if any)
  const vetoMap = new Map<MemberId, DayOption>();
  for (const option of options) {
    if (option.vetoBy !== null) {
      vetoMap.set(option.vetoBy, option);
    }
  }

  // Vote chip colors differ by weekday vs. weekend to match the app's color system
  const votedChipClass = isWeekend
    ? 'bg-weekend-light text-weekend-dark'
    : 'bg-primary-light text-primary-dark';

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Who's Voted
      </h3>

      <ul className="space-y-3">
        {FAMILY_MEMBERS.map((member) => {
          const avatarClasses = MEMBER_AVATAR_CLASSES[member.id];
          const votedOption = voteMap.get(member.id);
          const vetoedOption = vetoMap.get(member.id);
          const hasVetoBudget = vetoBudget[member.id] > 0;

          // Resolve the member object for completeness — used only via getMember for
          // consistency with the rest of the codebase rather than accessing `member` directly.
          const resolved = getMember(member.id);

          return (
            <li key={member.id} className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${avatarClasses.bg} ${avatarClasses.text}`}
                aria-label={resolved.name}
              >
                {resolved.emoji}
              </div>

              {/* Name + status chips */}
              <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                <span className="font-medium text-gray-800 shrink-0">{resolved.name}</span>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Vote status chip */}
                  {votedOption ? (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${votedChipClass}`}
                    >
                      {votedOption.name}
                    </span>
                  ) : (
                    <span className="text-xs italic text-gray-400">Not voted</span>
                  )}

                  {/* Veto chip — shown when this member placed a veto */}
                  {vetoedOption && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-veto-bg text-veto-text">
                      Vetoed {vetoedOption.name}
                    </span>
                  )}

                  {/* Veto budget badge — shown only when the member still has their veto */}
                  {hasVetoBudget && (
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500"
                      title="Veto available"
                    >
                      🛡 1
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default VoterPanel;
