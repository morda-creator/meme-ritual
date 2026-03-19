

## Plan: Soft Launch Readiness for Friday

### Current Status

The app is stuck in **demo mode**: Index.tsx uses `getDemoPhase(demoPhase)` with a manual PhaseSelector, ignoring the real time-based phase logic and the competition's `status` field from the database. The backend (`advance-phase`, `bot-submit`, `generate-theme`) is ready, but the frontend doesn't react to it.

### Key Problem: Demo vs Live Mode

Right now the UI phase is determined by a local React state (`demoPhase`), not by the competition's actual `status` in the database. For a real Friday test, the UI needs to follow the DB status.

### What Needs to Happen

#### 1. Add a mode toggle: Live vs Demo

Introduce an environment variable or URL parameter (`?demo=true`) to switch between modes:

- **Live mode** (default): Phase comes from `competition.status` in the database. No PhaseSelector shown. The `advance-phase` edge function (or pg_cron) drives transitions.
- **Demo mode** (`?demo=true`): Current behavior preserved — manual PhaseSelector, forced phase.

Changes in `src/pages/Index.tsx`:
- Read `competition.status` as the phase source in live mode
- Only show PhaseSelector when `?demo=true` is in the URL
- Map competition status strings to Phase type

#### 2. Set up pg_cron to auto-advance phases on Friday

The pg_cron extension is already enabled but no jobs are scheduled. Add a migration that creates cron jobs calling `advance-phase` at the right times (CET):

```text
09:00 CET (08:00 UTC) → submission phase + generate theme
13:00 CET (12:00 UTC) → voting phase  
16:00 CET (15:00 UTC) → reveal phase
```

Each job calls the `advance-phase` edge function via `pg_net`.

#### 3. Fix generate-theme to also trigger bot-submit

Currently `generate-theme` calls `seed-memes` (the old immediate seeder). Update it to call `bot-submit` instead, so bots submit with staggered delays.

#### 4. Ensure countdown timer works in live mode

In live mode, derive `nextPhaseTime` from the competition status:
- `submission` → voting starts at 13:00 CET today
- `voting` → reveal starts at 16:00 CET today
- `reveal` / `preparing` → next Friday 09:00

#### 5. Guard submissions and voting by phase

Currently any phase allows submission/voting since it's demo-controlled. In live mode, lock actions to the actual phase:
- Submission upload only shown when `competition.status === 'submission'`
- Vote buttons only active when `competition.status === 'voting'`

### Files to Edit

- **`src/pages/Index.tsx`** — Add live/demo mode switch, derive phase from competition status
- **`src/lib/phases.ts`** — Add helper to map competition status + compute next phase time
- **`supabase/migrations/` (new)** — pg_cron jobs for Friday phase transitions
- **`supabase/functions/generate-theme/index.ts`** — Replace `seed-memes` call with `bot-submit`

### What This Gives You for Friday

1. Open the published URL — it auto-creates today's competition at 09:00
2. Phases advance automatically at 09:00, 13:00, 16:00 CET
3. Bot memes trickle in during submission phase
4. Reveal at 16:00 shows winner + bot unmasking
5. Add `?demo=true` to URL anytime to test with manual phase switching

### Risks and Considerations

- **Timezone**: The cron jobs use UTC. CET is UTC+1 (or CEST UTC+2 in summer). March 2026 is in CET (UTC+1) since DST starts March 29. So 09:00 CET = 08:00 UTC is correct for this Friday.
- **First user visit**: If nobody visits before 09:00, the competition won't exist yet. The cron job at 08:00 UTC should call `generate-theme` to ensure it's created. Alternatively, `advance-phase` can create it.
- **Edge function timeouts**: `bot-submit` has delays of up to 5 minutes. Deno edge functions have a default timeout. The staggered approach with `setTimeout` should work within Supabase's 150s wall time limit. We may need to split into multiple invocations (one per bot meme) triggered by a short delay chain.

