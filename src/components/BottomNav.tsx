import { NavLink } from 'react-router-dom';
import { useDay } from '../hooks/useDay';

// Active color for weekday navigation (matches primary-dark theme).
const WEEKDAY_ACTIVE_COLOR = '#1D9E75';

// Active color for weekend navigation (matches weekend-dark theme).
const WEEKEND_ACTIVE_COLOR = '#185FA5';

interface Tab {
  path: string;
  icon: string;
  label: string;
}

function getWeekdayTabs(): Tab[] {
  return [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/recipes', icon: '🍳', label: 'Recipes' },
    { path: '/week', icon: '📅', label: 'Week' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];
}

function getWeekendTabs(): Tab[] {
  return [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/recipes', icon: '🗺', label: 'Restaurants' },
    { path: '/week', icon: '📅', label: 'Week' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];
}

export function BottomNav() {
  const { isWeekend } = useDay();

  const tabs = isWeekend ? getWeekendTabs() : getWeekdayTabs();
  const activeColor = isWeekend ? WEEKEND_ACTIVE_COLOR : WEEKDAY_ACTIVE_COLOR;

  return (
    // Fixed at the bottom, full width, 60px tall. The env(safe-area-inset-bottom)
    // padding prevents tabs from being obscured by home indicators on iOS.
    <nav
      className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.08)] flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className="flex-1 flex flex-col items-center justify-center"
          // WHY: NavLink className prop receives { isActive } so we can apply
          // the correct color without a separate wrapper component.
          style={({ isActive }) => ({
            color: isActive ? activeColor : undefined,
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className={`text-xl leading-none ${isActive ? '' : 'text-gray-400'}`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-xs mt-0.5 leading-none ${isActive ? 'font-semibold' : 'text-gray-400'}`}
              >
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
