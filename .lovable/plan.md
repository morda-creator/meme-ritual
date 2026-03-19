

## Plan: Demo Mode with AI-Generated Content (No Production Data)

### Approach
Create a dedicated edge function that generates a theme and bot memes but returns them as JSON without writing anything to the database. The frontend stores this in React state only — production data stays clean.

### Changes

#### 1. New edge function: `supabase/functions/demo-generate/index.ts`
- Calls the same AI prompts as `generate-theme` and `bot-submit` but never touches the database
- Returns: `{ theme: { title, intro }, memes: [{ imageUrl, aiComment, authorName }] }`
- Generates 3-4 memes using memegen.link URLs (same as bot-submit)
- No Friday guard — works any day

#### 2. `src/hooks/useDemo.ts` — New hook for demo state
- Manages demo-only state: `demoTheme`, `demoMemes`, `generating`
- `generateDemo()` function calls the `demo-generate` edge function
- Returns mock `MemeWithVote[]` objects with fake IDs, vote counts, etc.
- All data lives in React state only — nothing persisted

#### 3. `src/pages/Index.tsx` — Use demo data when in demo mode
- In demo mode: use `useDemo()` hook for theme and memes instead of `useCompetition()`
- Skip the `useCompetition` fetch entirely when `isDemo` is true (avoid unnecessary DB calls)

#### 4. `src/components/MemeRitual/PhaseSelector.tsx` — Add "Generate" button
- Add a "Generate Ritual" button next to the phase tabs
- Shows loading state while generating
- Calls `onGenerate()` callback passed from Index

#### 5. `supabase/config.toml` — Register new function
- Add `[functions.demo-generate]` with `verify_jwt = false`

### Data Flow
```text
Demo mode:
  PhaseSelector [Generate] → useDemo.generateDemo()
    → edge function demo-generate (AI only, no DB)
    → returns { theme, memes[] }
    → stored in React state
    → displayed in UI

Production:
  No change. useCompetition reads from DB as before.
```

### Files to create/edit
- **Create** `supabase/functions/demo-generate/index.ts`
- **Create** `src/hooks/useDemo.ts`
- **Edit** `src/pages/Index.tsx` — wire up demo hook
- **Edit** `src/components/MemeRitual/PhaseSelector.tsx` — add generate button

