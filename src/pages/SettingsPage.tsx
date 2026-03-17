import { useFamily } from '../hooks/useFamily';
import { hasFirebaseConfig } from '../lib/firebase';
import { FAMILY_MEMBERS } from '../types';

export function SettingsPage() {
  const { currentMember, vetoBudget } = useFamily();

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Family management & preferences</p>
      </div>

      <div className="flex-1 px-4 py-4 pb-20 space-y-4">
        {/* Current user info */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Current User
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: currentMember.color.bg }}
            >
              {currentMember.emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentMember.name}</p>
              <p className="text-sm text-gray-500">
                {currentMember.isAdmin ? 'Admin' : 'Voter'}
              </p>
            </div>
          </div>
        </div>

        {/* Connection status */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Connection
          </h2>
          {hasFirebaseConfig ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="w-4 h-4 rounded-full bg-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Connected to Firebase</p>
                <p className="text-xs text-green-600">Votes sync in real-time across devices</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="w-4 h-4 rounded-full bg-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Demo Mode</p>
                <p className="text-xs text-amber-600">Data is local only — configure Firebase to sync</p>
              </div>
            </div>
          )}
        </div>

        {/* Family members */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Family Members
          </h2>
          <ul className="space-y-3">
            {FAMILY_MEMBERS.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: member.color.bg }}
                >
                  {member.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">
                    {member.isAdmin ? 'Admin' : 'Voter'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    vetoBudget[member.id] > 0
                      ? 'bg-primary-light text-primary-dark'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {vetoBudget[member.id] > 0 ? '🛡 Veto available' : 'Veto used'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Veto budget overview */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Veto Budget This Week
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Each family member gets 1 veto per week. Vetoes reset every Monday.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FAMILY_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: member.color.bg }}
              >
                <span className="text-lg">{member.emoji}</span>
                <span className="text-sm font-medium" style={{ color: member.color.text }}>
                  {member.name}
                </span>
                <span className="ml-auto text-sm font-bold" style={{ color: member.color.text }}>
                  {vetoBudget[member.id] > 0 ? '1' : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            About
          </h2>
          <p className="text-sm text-gray-600">
            Adler Family Dinner Planner v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Built with React + Vite + Firebase
          </p>
        </div>
      </div>
    </div>
  );
}
