import { FAMILY_MEMBERS, type MemberId } from '../types';
import { useDinnerStore } from '../stores/dinnerStore';

export function UserSwitcher() {
  const currentUser = useDinnerStore((s) => s.currentUser);
  const setCurrentUser = useDinnerStore((s) => s.setCurrentUser);

  const activeMember = FAMILY_MEMBERS.find((m) => m.id === currentUser)!;

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex flex-col items-center gap-1.5">
      {/* Label sits above the avatars to keep the bar compact */}
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none">
        Demo Mode
      </span>

      <div className="flex items-center gap-2">
        {FAMILY_MEMBERS.map((member) => {
          const isActive = member.id === currentUser;

          return (
            <button
              key={member.id}
              onClick={() => setCurrentUser(member.id as MemberId)}
              aria-label={`Switch to ${member.name}`}
              aria-pressed={isActive}
              // WHY: ring color uses the member's own text color so the
              // active indicator feels personal rather than generic blue.
              style={{
                backgroundColor: member.color.bg,
                // Ring is simulated with box-shadow so we can use the
                // member's exact brand color without Tailwind arbitrary values.
                boxShadow: isActive
                  ? `0 0 0 2px white, 0 0 0 4px ${member.color.text}`
                  : 'none',
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-shadow duration-150 cursor-pointer"
            >
              {member.emoji}
            </button>
          );
        })}
      </div>

      <span className="text-xs text-gray-500 leading-none">
        Playing as:{' '}
        <span className="font-semibold" style={{ color: activeMember.color.text }}>
          {activeMember.name}
        </span>
      </span>
    </div>
  );
}
