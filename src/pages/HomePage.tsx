import { useState } from 'react';
import { CalendarStrip } from '../components/CalendarStrip';
import { UserSwitcher } from '../components/UserSwitcher';
import { OptionCard } from '../components/OptionCard';
import { VoterPanel } from '../components/VoterPanel';
import { ConsensusBanner } from '../components/ConsensusBanner';
import { AddOptionModal } from '../components/AddOptionModal';
import { useDay } from '../hooks/useDay';
import { useVote } from '../hooks/useVote';
import { useHistory } from '../hooks/useHistory';
import { useDinnerStore } from '../stores/dinnerStore';
import type { DayOption } from '../types';
import { DAY_LABELS } from '../types';

export function HomePage() {
  const { activeDay, dayStatus, isWeekend, consensus } = useDay();
  const { vote, veto, canVeto, currentUser, vetoBudget } = useVote();
  const { getLastHadLabel } = useHistory();
  const addOption = useDinnerStore((s) => s.addOption);
  const settleMeal = useDinnerStore((s) => s.settleMeal);

  const [showAddModal, setShowAddModal] = useState(false);

  const activeOptions = dayStatus.options;

  function handleAddOption(opt: { name: string; emoji: string; sub: string; type: DayOption['type'] }) {
    const newOption: DayOption = {
      id: `opt-${Date.now()}`,
      name: opt.name,
      emoji: opt.emoji,
      sub: opt.sub || getDefaultSub(opt.type),
      type: opt.type,
      votes: [],
      vetoBy: null,
      addedBy: currentUser,
      lastHadDate: null,
    };
    addOption(activeDay, newOption);
    setShowAddModal(false);
  }

  function handleSettle() {
    if (consensus.winner) {
      settleMeal(activeDay, consensus.winner.name, consensus.winner.emoji, consensus.winner.type);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <CalendarStrip />
      <UserSwitcher />

      <div className="flex-1 px-4 py-4 pb-20 space-y-4">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {DAY_LABELS[activeDay]}{isWeekend ? ' — Eat Out' : ' — Dinner'}
          </h1>
          {dayStatus.settledMeal && (
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary-light text-primary-dark">
              Decided
            </span>
          )}
        </div>

        {/* Settled state */}
        {dayStatus.settledMeal ? (
          <div className="bg-white rounded-xl border border-primary-border p-6 text-center">
            <p className="text-4xl mb-2">🍽</p>
            <p className="text-2xl font-bold text-gray-900">{dayStatus.settledMeal}</p>
            <p className="text-sm text-gray-500 mt-1">Tonight's dinner is set!</p>
          </div>
        ) : (
          <>
            {/* Consensus / Tie banner */}
            <ConsensusBanner
              status={consensus.status}
              winner={consensus.winner}
              tied={consensus.tied}
              isWeekend={isWeekend}
              onSettle={handleSettle}
            />

            {/* Options list */}
            {activeOptions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🍽</p>
                <p className="text-sm">No options yet. Add something!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOptions.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isWeekend={isWeekend}
                    onVote={() => vote(activeDay, option.id)}
                    onVeto={() => veto(activeDay, option.id)}
                    canVeto={canVeto(currentUser)}
                    lastHadLabel={getLastHadLabel(option.name)}
                  />
                ))}
              </div>
            )}

            {/* Add option button */}
            <button
              onClick={() => setShowAddModal(true)}
              className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors
                ${isWeekend
                  ? 'border-weekend-border text-weekend hover:bg-weekend-light'
                  : 'border-primary-border text-primary hover:bg-primary-light'
                }`}
            >
              + Suggest something
            </button>

            {/* Voter panel */}
            <VoterPanel
              options={activeOptions}
              isWeekend={isWeekend}
              vetoBudget={vetoBudget}
            />
          </>
        )}
      </div>

      <AddOptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddOption}
        isWeekend={isWeekend}
      />
    </div>
  );
}

function getDefaultSub(type: DayOption['type']): string {
  switch (type) {
    case 'cook': return 'Cook at home';
    case 'order': return 'Delivery';
    case 'restaurant': return 'Restaurant';
  }
}
