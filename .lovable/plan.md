

## Plan: Preparing Phase with Archive + Countdown

### What changes

**1. New hook: `useArchive`**
- Fetches past competitions from the `competitions` table where `status = 'reveal'` (completed), ordered by `competition_date` descending
- For each competition, fetches the winning meme (using `winner_meme_id`) including its `image_url`, `vote_count`, and `author_name`
- Returns `{ pastCompetitions, loading }`

**2. New component: `ArchiveSection`**
- Shown only during the `preparing` phase in `Index.tsx`
- Top: large countdown timer to next Friday 09:00 with atmospheric text ("The next ritual begins in...")
- Below: scrollable list of past competitions as cards, each showing:
  - Theme title
  - Competition date
  - Winning meme image (thumbnail)
  - Winner announcement text (truncated)
  - Vote count of winner
- Empty state if no past competitions yet: "No rituals have concluded. The archive awaits."
- Styled consistently with existing terminal/mono aesthetic

**3. Header adjustments**
- When phase is `preparing`, hide the "This week's theme" box (since no active theme should be revealed)
- Show a mysterious placeholder instead: "Theme will be revealed when the ritual begins"

**4. Index.tsx update**
- Replace the current `preparing` placeholder div with the new `ArchiveSection` component

### Files to create/edit
- `src/hooks/useArchive.ts` (new)
- `src/components/MemeRitual/ArchiveSection.tsx` (new)
- `src/components/MemeRitual/RitualHeader.tsx` (conditionally hide theme)
- `src/pages/Index.tsx` (wire up archive in preparing phase)

