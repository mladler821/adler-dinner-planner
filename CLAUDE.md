# Adler Family Dinner Planner

## Architecture

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS v4 + Firebase (Firestore + Auth) + Zustand

**Directory structure:**
```
src/
  components/   # Reusable UI components
  pages/        # Route-level pages (HomePage, RecipesPage, WeekPage, SettingsPage)
  hooks/        # Custom React hooks (useDay, useVote, useHistory, useFamily)
  lib/          # Firebase config, Claude API helper
  stores/       # Zustand store (dinnerStore.ts)
  types/        # TypeScript interfaces and constants
```

## Key Design Decisions

- **Demo mode first**: The app runs fully offline with seed data when no Firebase config is present. All features work with the Zustand in-memory store.
- **Zustand over React Context**: Chosen for its minimal boilerplate and efficient selective re-renders.
- **Member colors are hardcoded**: Matt (blue), Amanda (pink), Jaden (amber), Adalynn (purple). Defined in `src/types/index.ts` and as Tailwind theme tokens in `src/index.css`.
- **Weekday/weekend theming**: Green (#1D9E75) for weekday cooking, blue (#185FA5) for weekend restaurants. Components check `isWeekend()` to switch color schemes.
- **Claude API with fallback**: Recipe suggestions use the Anthropic API with `anthropic-dangerous-direct-browser-access` header. Falls back to mock data when no API key is configured.

## Data Flow

1. `useDinnerStore` holds all state (days, options, votes, vetoes, history)
2. Custom hooks (`useDay`, `useVote`, `useHistory`) provide focused slices of state
3. Components subscribe to only the state they need via Zustand selectors
4. In production: Firestore `onSnapshot` listeners would sync state across devices

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Firebase Setup

1. Create a Firebase project at console.firebase.google.com
2. Enable Firestore and Google Auth
3. Copy config values to `.env` (see `.env.example`)
4. Deploy: `firebase deploy`
