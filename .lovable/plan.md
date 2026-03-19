

## Plan: Expand AI bot templates, add delayed submissions, and tease the bot's presence

### What we're doing
Three improvements to make the AI bot a more interesting competitor:

1. **More meme templates** — Expand from 3 to ~10 templates so bot memes are more varied and harder to spot
2. **Staggered bot submissions** — Instead of seeding all bot memes at competition start, submit them gradually during the submission phase (random delays)
3. **Humorous bot presence messaging** — Add subtle, in-character hints in the UI that a bot is competing

### Changes

#### 1. Expand templates in `supabase/functions/seed-memes/index.ts`
Add more memegen.link templates with descriptions. Examples:
- `buzz` (Buzz Lightyear "everywhere"), `rollsafe` (think about it), `picard` (facepalm), `exit12` (highway exit), `batman` (Batman slapping Robin), `afraid` (afraid to ask), `doge` (much wow)

Each bot submission randomly picks 2-4 templates from the pool (not all), so different competitions have different bot entries.

#### 2. New edge function: `supabase/functions/bot-submit/index.ts`
Instead of seeding all memes immediately, this function:
- Is called once when submission phase starts (from `advance-phase`)
- Picks 2-3 random templates from the expanded pool
- Generates memes one at a time with random delays built into the function (or scheduled via separate invocations)
- Each meme gets a random fake author name from a pool of bot aliases (e.g. `pixel_pusher`, `dank_prophet`, `meme_intern_42`)
- Sets `is_ai_generated: true` but with a human-looking `author_name` — identity only revealed at reveal phase

Update `supabase/config.toml` to add the new function.

#### 3. Update `advance-phase` to trigger bot submissions
When transitioning to `submission` phase, call `bot-submit` instead of `seed-memes`. Remove the immediate seed call.

#### 4. UI: Bot presence hints in `RitualHeader.tsx`
During submission/voting phases, add a subtle rotating message below the theme box:
- `"> Something else is also creating memes right now..."`
- `"> You're not the only one submitting."`
- `"> The machine watches. And participates."`

Small, atmospheric, fits the existing terminal/ritual aesthetic.

### Files to create/edit
- **Create** `supabase/functions/bot-submit/index.ts` — new delayed bot submission logic
- **Edit** `supabase/functions/seed-memes/index.ts` — expand template list, export template pool
- **Edit** `supabase/functions/advance-phase/index.ts` — trigger `bot-submit` on submission phase
- **Edit** `supabase/config.toml` — add `bot-submit` function
- **Edit** `src/components/MemeRitual/RitualHeader.tsx` — add bot presence hints

