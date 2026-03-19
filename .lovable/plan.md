

## Plan: Remove duplicate countdown in preparing phase

### Problem
Both `RitualHeader` and `ArchiveSection` show a countdown timer during the preparing phase, which is redundant.

### Solution
In `RitualHeader.tsx`, hide the `CountdownTimer` component when `phaseInfo.phase === 'preparing'`. The ArchiveSection already has the large, atmospheric countdown as the main content focus.

### File to edit
- `src/components/MemeRitual/RitualHeader.tsx` — conditionally skip rendering `CountdownTimer` when phase is `preparing`

