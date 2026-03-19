

## Plan: Enable Submission in Demo Mode

### Problem
The `SubmitSection` component is conditionally hidden when `isDemo` is true (`{!isDemo && <SubmitSection />}`). In production, submission works but only when a competition exists (Fridays).

### Changes

#### 1. `src/pages/Index.tsx` — Show SubmitSection in demo mode
- Remove the `!isDemo &&` guard so SubmitSection renders in both modes
- In demo mode, submitted memes get added to the local `demoMemes` state instead of hitting the database

#### 2. `src/hooks/useDemo.ts` — Add local demo submission
- Add a `demoSubmit(file: File, authorName?: string)` function
- Reads the file as a data URL and adds it to `demoMemes` state with a fake ID, zero votes, and a placeholder AI comment
- No database or edge function calls — purely local

#### 3. `src/pages/Index.tsx` — Route submit to correct handler
- When `isDemo`: call `demoSubmit` from useDemo
- When not demo: call `submitMeme` from useCompetition (existing behavior)

### Files to edit
- `src/hooks/useDemo.ts` — add `demoSubmit` function
- `src/pages/Index.tsx` — show SubmitSection always, route to demo/prod handler

