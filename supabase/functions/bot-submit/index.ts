import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MEME_TEMPLATES, BOT_ALIASES, encodeMemeText, pickRandom } from "../_shared/meme-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateMemeTexts(
  apiKey: string,
  theme: string,
  templates: typeof MEME_TEMPLATES
): Promise<Array<{ lines: string[] }>> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
          content: `Theme: "${theme}"\n\nGenerate text for these meme templates:\n\n${templates.map((t, i) => `${i + 1}. ${t.id} (${t.lines} lines): ${t.description}`).join("\n")}\n\nMake each hilarious and relevant to the theme.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "set_meme_texts",
            description: "Set text lines for each meme template",
            parameters: {
              type: "object",
              properties: {
                memes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lines: { type: "array", items: { type: "string" } },
                    },
                    required: ["lines"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["memes"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "set_meme_texts" } },
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI text generation failed:", response.status, t);
    throw new Error("Failed to generate meme texts");
  }

  const data = await response.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) throw new Error("No tool call in response");
  return JSON.parse(tc.function.arguments).memes;
}

async function generateComment(apiKey: string, theme: string, templateId: string, lines: string[]): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are the dry, sardonic AI host of MEME_RITUAL. Write a brief comment (1 sentence, under 100 chars) about a meme submission. Be witty, dry, slightly existential. Theme: "${theme}"`,
        },
        { role: "user", content: `Comment on a "${templateId}" meme with text: ${lines.map((l, i) => `Line ${i + 1}: "${l}"`).join(", ")}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "post_comment",
          description: "Post commentary",
          parameters: {
            type: "object",
            properties: { comment: { type: "string" } },
            required: ["comment"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "post_comment" } },
    }),
  });

  if (!response.ok) {
    await response.text();
    return "The AI stares. Processing.";
  }

  const data = await response.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  return tc ? JSON.parse(tc.function.arguments).comment : "The AI stares. Processing.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { competition_id } = await req.json();
    if (!competition_id) {
      return new Response(JSON.stringify({ error: "competition_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: comp } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competition_id)
      .single();

    if (!comp) {
      return new Response(JSON.stringify({ error: "Competition not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick 2-4 random templates for this competition
    const botCount = 2 + Math.floor(Math.random() * 3); // 2-4
    const selectedTemplates = pickRandom(MEME_TEMPLATES, botCount);
    const selectedAliases = pickRandom(BOT_ALIASES, botCount);

    const theme = comp.theme_title;
    console.log(`Bot submitting ${botCount} memes for theme: "${theme}"`);

    // Generate all texts in one AI call
    const memeTexts = await generateMemeTexts(LOVABLE_API_KEY, theme, selectedTemplates);

    const results: string[] = [];

    for (let i = 0; i < selectedTemplates.length; i++) {
      // Small stagger to avoid race conditions (2-5 seconds)
      if (i > 0) {
        const delayMs = (2 + Math.floor(Math.random() * 3)) * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        const t = selectedTemplates[i];
        const textData = memeTexts[i] || { lines: Array(t.lines).fill("...") };
        const lines = textData.lines.slice(0, t.lines);
        while (lines.length < t.lines) lines.push("_");

        const encodedLines = lines.map((l) => encodeMemeText(l || "_"));
        const memeUrl = `https://api.memegen.link/images/${t.id}/${encodedLines.join("/")}.png?width=800&watermark=none`;

        // Generate AI commentary
        let aiComment = "The AI stares. Processing.";
        try {
          aiComment = await generateComment(LOVABLE_API_KEY, theme, t.id, lines);
        } catch (e) {
          console.error(`Commentary ${i} failed:`, e);
        }

        const { error: insertError } = await supabase.from("memes").insert({
          competition_id,
          image_url: memeUrl,
          ai_comment: aiComment,
          author_name: selectedAliases[i],
          is_ai_generated: true,
          session_id: `bot-${Date.now()}-${i}`,
          vote_count: 0,
        });

        if (insertError) {
          console.error(`Bot insert ${i} failed:`, insertError);
          results.push(`bot meme ${i}: insert failed`);
        } else {
          results.push(`bot meme ${i} (${t.id}) by "${selectedAliases[i]}": ${lines.join(" / ")}`);
        }
      } catch (e) {
        console.error(`Bot meme ${i} error:`, e);
        results.push(`bot meme ${i}: error`);
      }
    }

    return new Response(JSON.stringify({ results, bot_count: botCount, competition: theme }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-submit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
