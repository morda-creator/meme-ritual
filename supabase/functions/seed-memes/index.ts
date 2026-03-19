import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

interface MemeTemplate {
  id: string;
  description: string;
  author: string | null;
}

const MEME_TEMPLATES: MemeTemplate[] = [
  { id: "drake", description: "Drake Hotline Bling: top panel is something bad/boring, bottom panel is the preferred funny alternative", author: "entropy_enjoyer" },
  { id: "fine", description: "This Is Fine: dog sitting in burning room, top text is the denial, bottom can be empty or a punchline", author: null },
  { id: "distracted", description: "Distracted Boyfriend: the girlfriend (being ignored) is labeled, the other woman (distraction) is labeled, boyfriend is the person choosing", author: "ctrl_alt_defeat" },
];

async function generateMemeTexts(
  apiKey: string,
  theme: string,
  templates: MemeTemplate[]
): Promise<Array<{ top: string; bottom: string }>> {
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
          content: `You are a meme text writer. You write short, punchy, funny meme captions in the style of classic internet memes. Dry humor, absurd, relatable. Keep text SHORT (under 8 words per line). Always in English.`,
        },
        {
          role: "user",
          content: `Theme: "${theme}"

Generate top and bottom text for these ${templates.length} meme templates:

${templates.map((t, i) => `${i + 1}. ${t.id}: ${t.description}`).join("\n")}

Make each one hilarious and relevant to the theme. The humor should be dry, absurd, and internet-culture style.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "set_meme_texts",
            description: "Set the top and bottom text for each meme template",
            parameters: {
              type: "object",
              properties: {
                memes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      top: { type: "string", description: "Top text (short, under 8 words)" },
                      bottom: { type: "string", description: "Bottom text (short, under 8 words, can be empty string)" },
                    },
                    required: ["top", "bottom"],
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

  const parsed = JSON.parse(tc.function.arguments);
  return parsed.memes;
}

async function generateComment(apiKey: string, theme: string, templateId: string, top: string, bottom: string): Promise<string> {
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
        { role: "user", content: `Comment on a "${templateId}" meme. Top: "${top}", Bottom: "${bottom}"` },
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

    const { count } = await supabase
      .from("memes")
      .select("*", { count: "exact", head: true })
      .eq("competition_id", competition_id);

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Memes already seeded", count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const theme = comp.theme_title;

    // Step 1: Generate all meme texts in one AI call
    console.log("Generating meme texts for theme:", theme);
    const memeTexts = await generateMemeTexts(LOVABLE_API_KEY, theme, MEME_TEMPLATES);
    console.log("Generated texts:", JSON.stringify(memeTexts));

    const results: string[] = [];

    // Step 2: Create memes with generated texts
    for (let i = 0; i < MEME_TEMPLATES.length; i++) {
      try {
        const t = MEME_TEMPLATES[i];
        const texts = memeTexts[i] || { top: "When the meme writes itself", bottom: "" };

        const top = encodeMemeText(texts.top);
        const bottom = encodeMemeText(texts.bottom);

        const pathParts = [t.id, top];
        if (bottom) pathParts.push(bottom);
        const memeUrl = `https://api.memegen.link/images/${pathParts.join("/")}.png?width=800`;

        // Generate AI commentary
        let aiComment = "The AI stares. Processing.";
        try {
          aiComment = await generateComment(LOVABLE_API_KEY, theme, t.id, texts.top, texts.bottom);
        } catch (e) {
          console.error(`Commentary ${i} failed:`, e);
        }

        const isAI = t.author === null;
        const fakeVotes = Math.floor(Math.random() * 30) + 3;

        const { error: insertError } = await supabase.from("memes").insert({
          competition_id,
          image_url: memeUrl,
          ai_comment: aiComment,
          author_name: t.author || null,
          is_ai_generated: isAI,
          session_id: `seed-${i}`,
          vote_count: fakeVotes,
        });

        if (insertError) {
          console.error(`Insert ${i} failed:`, insertError);
          results.push(`meme ${i}: insert failed`);
        } else {
          results.push(`meme ${i} (${t.id}): "${texts.top}" / "${texts.bottom}"`);
        }

        if (i < MEME_TEMPLATES.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (e) {
        console.error(`Meme ${i} error:`, e);
        results.push(`meme ${i}: error`);
      }
    }

    return new Response(JSON.stringify({ results, competition: theme }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-memes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
