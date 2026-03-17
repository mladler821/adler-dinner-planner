import type { RecipeSuggestion } from '../types';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a helpful family dinner planner. Suggest quick, family-friendly weeknight dinner ideas. The family has 4 members: two adults and two teenagers (ages 15 and 13). Always respond with valid JSON only — no markdown, no preamble.`;

export async function getRecipeSuggestions(
  dayName: string,
  recentMeals: string[]
): Promise<RecipeSuggestion[]> {
  if (!ANTHROPIC_API_KEY) {
    // WHY: Return mock data when no API key configured so the app works in demo mode
    return getMockSuggestions();
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Suggest 4 dinner recipes for ${dayName}. Recent meals this week: ${recentMeals.join(', ') || 'none yet'}. Return a JSON array: [{name, emoji, tag, cookTime, servings, brief}]`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text) as RecipeSuggestion[];
}

export async function getFullRecipe(mealName: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return getMockRecipe(mealName);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'You are a helpful cooking assistant. Provide clear, step-by-step recipes for family dinners (4 servings: 2 adults, 2 teenagers). Use plain text with numbered steps. Include an ingredients list at the top.',
      messages: [
        {
          role: 'user',
          content: `Give me a complete recipe for: ${mealName}. Include ingredients list and numbered cooking steps.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function getMockSuggestions(): RecipeSuggestion[] {
  return [
    { name: 'Teriyaki Chicken Bowl', emoji: '🍗', tag: 'Asian', cookTime: '25 min', servings: 4, brief: 'Glazed chicken over rice with steamed broccoli' },
    { name: 'Sheet Pan Fajitas', emoji: '🌮', tag: 'Mexican', cookTime: '30 min', servings: 4, brief: 'Peppers, onions, and chicken roasted together' },
    { name: 'Pasta Primavera', emoji: '🍝', tag: 'Italian', cookTime: '20 min', servings: 4, brief: 'Penne with seasonal vegetables in garlic sauce' },
    { name: 'BBQ Salmon', emoji: '🐟', tag: 'Seafood', cookTime: '22 min', servings: 4, brief: 'Honey BBQ glazed salmon with roasted potatoes' },
  ];
}

function getMockRecipe(mealName: string): string {
  return `# ${mealName}\n\nServings: 4\nPrep Time: 10 minutes\nCook Time: 25 minutes\n\n## Ingredients\n- 1.5 lbs protein of choice\n- 2 cups rice or pasta\n- 2 cups mixed vegetables\n- 2 tbsp olive oil\n- Salt and pepper to taste\n- Your favorite sauce or seasoning\n\n## Instructions\n1. Prep all ingredients — dice vegetables, portion protein.\n2. Cook rice or pasta according to package directions.\n3. Heat olive oil in a large skillet over medium-high heat.\n4. Cook protein for 5-7 minutes until done.\n5. Add vegetables and cook for 3-4 minutes.\n6. Season to taste and serve over rice/pasta.\n\nEnjoy! 🍽️`;
}
