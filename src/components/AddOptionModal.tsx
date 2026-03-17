import { useState } from 'react';

interface AddOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (option: { name: string; emoji: string; sub: string; type: 'cook' | 'order' | 'restaurant' }) => void;
  isWeekend: boolean;
}

// Segmented control option definition
type SegmentOption = {
  value: 'cook' | 'order' | 'restaurant';
  label: string;
};

const WEEKDAY_SEGMENTS: SegmentOption[] = [
  { value: 'cook', label: 'Cook at home' },
  { value: 'order', label: 'Order delivery' },
];

const WEEKEND_SEGMENTS: SegmentOption[] = [
  { value: 'restaurant', label: 'Restaurant' },
];

// Subtitle placeholder varies by meal type to give users helpful hints
const SUB_PLACEHOLDERS: Record<'cook' | 'order' | 'restaurant', string> = {
  cook: 'e.g., 30 min prep',
  order: 'e.g., ~45 min delivery',
  restaurant: 'e.g., Italian · Casual',
};

export function AddOptionModal({ isOpen, onClose, onAdd, isWeekend }: AddOptionModalProps) {
  const defaultType = isWeekend ? 'restaurant' : 'cook';

  const [emoji, setEmoji] = useState('🍽');
  const [name, setName] = useState('');
  const [type, setType] = useState<'cook' | 'order' | 'restaurant'>(defaultType);
  const [sub, setSub] = useState('');

  if (!isOpen) return null;

  const segments = isWeekend ? WEEKEND_SEGMENTS : WEEKDAY_SEGMENTS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), emoji: emoji || '🍽', sub: sub.trim(), type });
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function resetForm() {
    setEmoji('🍽');
    setName('');
    // WHY: Reset type to the correct default for the current day context so the
    // next open starts in a sensible state rather than a stale selection.
    setType(isWeekend ? 'restaurant' : 'cook');
    setSub('');
  }

  function handleEmojiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // WHY: Emoji can be multi-codepoint (e.g. skin tone modifiers), so we slice
    // by spreading to Unicode code points rather than raw char index.
    const chars = [...val];
    // Keep only the last character entered so the field stays single-emoji
    setEmoji(chars.length > 0 ? chars[chars.length - 1] : '');
  }

  // Color scheme follows the app's weekday=green / weekend=blue convention
  const accentColor = isWeekend ? 'bg-[#185FA5]' : 'bg-[#1D9E75]';
  const accentHover = isWeekend ? 'hover:bg-[#0C447C]' : 'hover:bg-[#085041]';
  const segmentActive = isWeekend ? 'bg-[#185FA5] text-white' : 'bg-[#1D9E75] text-white';

  return (
    // Full-screen overlay — clicking the backdrop dismisses the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 animate-[fadeIn_0.15s_ease-out]"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add dinner option"
    >
      {/* Modal card — stopPropagation prevents overlay click from firing */}
      <div
        className="w-full max-w-sm bg-white rounded-xl p-6 mx-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a dinner option</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Emoji picker */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="add-option-emoji">
              Emoji
            </label>
            <input
              id="add-option-emoji"
              type="text"
              value={emoji}
              onChange={handleEmojiChange}
              className="w-16 text-center text-2xl border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75]"
              aria-label="Meal emoji"
            />
          </div>

          {/* Meal name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="add-option-name">
              Meal name <span className="text-red-500">*</span>
            </label>
            <input
              id="add-option-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tacos"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75] placeholder:text-gray-400"
            />
          </div>

          {/* Type segmented control — only shown when there are multiple choices */}
          {segments.length > 1 && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {segments.map((seg) => (
                  <button
                    key={seg.value}
                    type="button"
                    onClick={() => setType(seg.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      type === seg.value
                        ? segmentActive
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtitle / notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="add-option-sub">
              Details
            </label>
            <input
              id="add-option-sub"
              type="text"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder={SUB_PLACEHOLDERS[type]}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75] placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${accentColor} ${accentHover} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Add Option
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
