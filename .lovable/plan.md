
## Problem
memegen.link tilføjer et lille "memegen.link" watermark nederst på alle billeder som standard. Det gør det for nemt for brugere at spotte hvilke memes der er bot-genererede — hvilket ødelægger Reveal-faseens "plot twist".

## Løsning
memegen.link's API understøtter en `watermark=none` query-parameter der fjerner watermarket. Vi tilføjer den til alle steder hvor vi bygger meme URLs.

## Filer der skal opdateres

Tilføj `&watermark=none` til image URL i:

1. **`supabase/functions/bot-submit/index.ts`** (linje ~170)
   ```ts
   const memeUrl = `https://api.memegen.link/images/${t.id}/${encodedLines.join("/")}.png?width=800&watermark=none`;
   ```

2. **`supabase/functions/demo-generate/index.ts`** (linje ~140)
   ```ts
   const imageUrl = `https://api.memegen.link/images/${t.id}/${encodedLines.join("/")}.png?width=800&watermark=none`;
   ```

3. **`supabase/functions/seed-memes/index.ts`** — tjekkes og opdateres hvis den også bygger memegen URLs.

4. **`src/lib/mockData.ts`** — hvis der findes hardcoded memegen URLs til mock data, opdateres tilsvarende.

## Bemærk
- Eksisterende memes i databasen (fra tidligere konkurrencer) bevarer deres watermark — kun nye bot submissions bliver clean. Det er fint; arkivet er historik.
- Ingen ændringer til frontend, schema eller AI-prompts. Rent URL-fix i edge functions.
