import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MemeTemplate {
  id: string;
  lines: number;
  description: string;
}

const MEME_TEMPLATES: MemeTemplate[] = [
  { id: "drake", lines: 2, description: "Drakeposting: top = bad/boring, bottom = preferred alternative" },
  { id: "fine", lines: 2, description: "This Is Fine: dog in burning room. Line 1 = situation, Line 2 = denial" },
  { id: "db", lines: 3, description: "Distracted Boyfriend: Line 1 = distraction, Line 2 = boyfriend, Line 3 = girlfriend" },
  { id: "buzz", lines: 2, description: "Buzz Lightyear 'X everywhere': Line 1 = subject, Line 2 = 'X everywhere'" },
  { id: "rollsafe", lines: 2, description: "Roll Safe think about it: Line 1 = flawed premise, Line 2 = 'clever' conclusion" },
  { id: "picard", lines: 2, description: "Picard facepalm: Line 1 = frustrating thing, Line 2 = why it's dumb" },
  { id: "batman", lines: 2, description: "Batman slapping Robin: Line 1 = Robin says something dumb, Line 2 = Batman's response" },
  { id: "doge", lines: 2, description: "Doge: Line 1 = 'much X', Line 2 = 'very Y / wow'" },
];

const BOT_ALIASES = [
  "pixel_pusher", "dank_prophet", "meme_intern_42", "ctrl_alt_defeat",
  "entropy_enjoyer", "the_algorithm", "null_pointer", "cache_money",
];

function encodeMemeText(text: string): string {
  return text
    .replace(/_/g, "__")
    .replace(/ /g, "_")
    .replace(/\?/g, "~q")
    .replace(/%/g, "~p")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''")
    .replace(/-/g, "--");
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 1. Generate theme
    const themeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are the host of MEME_RITUAL, a weekly meme competition. Your tone is dry, witty, slightly sarcastic, culturally aware and internet-native, a bit absurd and existential. Never corporate or overly excited. Generate a weekly meme theme referencing current cultural moments, tech trends, internet culture, or absurd observations about modern life.`,
          },
          { role: "user", content: "Generate this week's meme competition theme. Make it topical, sharp, and slightly unhinged." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "set_theme",
            description: "Set the weekly meme competition theme",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short theme title, 3-8 words" },
                intro: { type: "string", description: "1-2 sentence sardonic intro, under 200 chars" },
              },
              required: ["title", "intro"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "set_theme" } },
      }),
    });

    if (!themeResponse.ok) {
      const t = await themeResponse.text();
      console.error("Theme generation failed:", themeResponse.status, t);
      if (themeResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. The ritual requires patience." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (themeResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Theme generation failed");
    }

    const themeData = await themeResponse.json();
    const themeTc = themeData.choices?.[0]?.message?.tool_calls?.[0];
    if (!themeTc) throw new Error("No theme tool call");
    const theme = JSON.parse(themeTc.function.arguments);

    // 2. Generate meme texts
    const botCount = 3 + Math.floor(Math.random() * 2); // 3-4
    const selectedTemplates = pickRandom(MEME_TEMPLATES, botCount);
    const selectedAliases = pickRandom(BOT_ALIASES, botCount);

    const textsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a meme text writer. Write short, punchy, funny meme captions. Dry humor, absurd, relatable. Each line under 8 words. Always English.`,
          },
          {
            role: "user",
            content: `Theme: "${theme.title}"\n\nGenerate text for these meme templates:\n\n${selectedTemplates.map((t, i) => `${i + 1}. ${t.id} (${t.lines} lines): ${t.description}`).join("\n")}\n\nAlso write a short sardonic AI commentary (1 sentence, under 100 chars) for each meme.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "set_meme_data",
            description: "Set text and commentary for each meme",
            parameters: {
              type: "object",
              properties: {
                memes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lines: { type: "array", items: { type: "string" } },
                      comment: { type: "string", description: "Sardonic AI commentary, under 100 chars" },
                    },
                    required: ["lines", "comment"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["memes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "set_meme_data" } },
      }),
    });

    if (!textsResponse.ok) {
      await textsResponse.text();
      throw new Error("Meme text generation failed");
    }

    const textsData = await textsResponse.json();
    const textsTc = textsData.choices?.[0]?.message?.tool_calls?.[0];
    if (!textsTc) throw new Error("No meme texts tool call");
    const memeTexts = JSON.parse(textsTc.function.arguments).memes;

    // 3. Build memes array (no DB writes!)
    const memes = selectedTemplates.map((t, i) => {
      const textData = memeTexts[i] || { lines: Array(t.lines).fill("..."), comment: "The AI stares." };
      const lines = textData.lines.slice(0, t.lines);
      while (lines.length < t.lines) lines.push("_");

      const encodedLines = lines.map((l: string) => encodeMemeText(l || "_"));
      const imageUrl = `https://api.memegen.link/images/${t.id}/${encodedLines.join("/")}.png?width=800`;

      return {
        imageUrl,
        aiComment: textData.comment || "The AI stares. Processing.",
        authorName: selectedAliases[i],
        voteCount: Math.floor(Math.random() * 12),
      };
    });

    return new Response(JSON.stringify({ theme, memes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("demo-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
