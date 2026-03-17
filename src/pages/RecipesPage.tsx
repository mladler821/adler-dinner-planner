import { useState } from 'react';
import { getRecipeSuggestions, getFullRecipe } from '../lib/claude';
import { useDay } from '../hooks/useDay';
import { useHistory } from '../hooks/useHistory';
import { useDinnerStore } from '../stores/dinnerStore';
import { DAY_LABELS } from '../types';
import type { RecipeSuggestion, DayOption } from '../types';

export function RecipesPage() {
  const { activeDay, isWeekend } = useDay();
  const { history } = useHistory();
  const addOption = useDinnerStore((s) => s.addOption);
  const currentUser = useDinnerStore((s) => s.currentUser);

  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipeModal, setRecipeModal] = useState<{ name: string; text: string } | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set());

  async function handleGetSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const recentMeals = history
        .filter((h) => {
          const daysAgo = Math.floor((Date.now() - h.date.getTime()) / (1000 * 60 * 60 * 24));
          return daysAgo <= 7;
        })
        .map((h) => h.meal);

      const results = await getRecipeSuggestions(DAY_LABELS[activeDay], recentMeals);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function handleFullRecipe(name: string) {
    setLoadingRecipe(name);
    try {
      const text = await getFullRecipe(name);
      setRecipeModal({ name, text });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoadingRecipe(null);
    }
  }

  function handleAddToOptions(suggestion: RecipeSuggestion) {
    const newOption: DayOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: suggestion.name,
      emoji: suggestion.emoji,
      sub: `Cook at home · ${suggestion.cookTime}`,
      type: 'cook',
      votes: [],
      vetoBy: null,
      addedBy: currentUser,
      lastHadDate: null,
    };
    addOption(activeDay, newOption);
    setAddedMeals((prev) => new Set(prev).add(suggestion.name));
  }

  // Weekend shows restaurant suggestions instead
  const pageTitle = isWeekend ? 'Restaurant Ideas' : 'Recipe Ideas';
  const pageDescription = isWeekend
    ? 'Get restaurant suggestions for the weekend'
    : `Get dinner ideas for ${DAY_LABELS[activeDay]}`;
  const buttonLabel = isWeekend
    ? 'Get restaurant ideas'
    : `Get recipe ideas for ${DAY_LABELS[activeDay]}`;

  const accentBg = isWeekend ? 'bg-weekend' : 'bg-primary';
  const accentHover = isWeekend ? 'hover:bg-weekend-dark' : 'hover:bg-primary-dark';

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-sm text-gray-500">{pageDescription}</p>
      </div>

      <div className="flex-1 px-4 py-4 pb-20 space-y-4">
        {/* Get suggestions button */}
        <button
          onClick={handleGetSuggestions}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-medium text-sm transition-colors ${accentBg} ${accentHover} disabled:opacity-50`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Thinking...
            </span>
          ) : (
            buttonLabel
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Suggestion cards */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, i) => {
              const alreadyAdded = addedMeals.has(suggestion.name);
              return (
                <div
                  key={`${suggestion.name}-${i}`}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{suggestion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{suggestion.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {suggestion.tag}
                        </span>
                        <span className="text-xs text-gray-500">{suggestion.cookTime}</span>
                        <span className="text-xs text-gray-400">· {suggestion.servings} servings</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.brief}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToOptions(suggestion)}
                      disabled={alreadyAdded}
                      className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors
                        ${alreadyAdded
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : `${accentBg} text-white ${accentHover}`
                        }`}
                    >
                      {alreadyAdded ? 'Added!' : "Add to tonight's options"}
                    </button>
                    <button
                      onClick={() => handleFullRecipe(suggestion.name)}
                      disabled={loadingRecipe === suggestion.name}
                      className="flex-1 text-xs font-medium py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {loadingRecipe === suggestion.name ? 'Loading...' : 'Full recipe →'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Get more ideas */}
            <button
              onClick={handleGetSuggestions}
              disabled={loading}
              className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Get more ideas
            </button>
          </div>
        )}

        {/* Empty state */}
        {suggestions.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">{isWeekend ? '🗺' : '🍳'}</p>
            <p className="text-sm">
              {isWeekend
                ? 'Tap above to get restaurant suggestions!'
                : 'Tap above to get AI-powered recipe ideas!'}
            </p>
          </div>
        )}
      </div>

      {/* Full recipe modal */}
      {recipeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setRecipeModal(null)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] bg-white rounded-xl shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-900">{recipeModal.name}</h2>
              <button
                onClick={() => setRecipeModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {recipeModal.text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
