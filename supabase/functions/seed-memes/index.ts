import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Classic meme templates from memegen.link
// Format: { template, top, bottom }
// Text encoding: spaces = underscores, special chars need encoding
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
  template: string;
  topFn: (theme: string) => string;
  bottomFn: (theme: string) => string;
  author: string | null; // null = AI bot
}

const MEME_TEMPLATES: MemeTemplate[] = [
  {
    template: "drake",
    topFn: () => "Actually dealing with your problems",
    bottomFn: (theme) => `Making memes about ${theme}`,
    author: "entropy_enjoyer",
  },
  {
    template: "fine",
    topFn: () => "This is fine",
    bottomFn: () => "",
    author: null, // AI bot
  },
  {
    template: "distracted",
    topFn: (theme) => `${theme}`,
    bottomFn: () => "My actual responsibilities",
    author: "ctrl_alt_defeat",
  },
];

const FAKE_VOTES = () => Math.floor(Math.random() * 30) + 3;

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

    // Check if memes already exist
    const { count } = await supabase
      .from("memes")
      .select("*", { count: "exact", head: true })
      .eq("competition_id", competition_id);

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Memes already seeded", count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];
    const theme = comp.theme_title;

    for (let i = 0; i < MEME_TEMPLATES.length; i++) {
      try {
        const t = MEME_TEMPLATES[i];
        const top = encodeMemeText(t.topFn(theme));
        const bottom = encodeMemeText(t.bottomFn(theme));

        // Build memegen.link URL — no API key needed
        const pathParts = [t.template, top];
        if (bottom) pathParts.push(bottom);
        const memeUrl = `https://api.memegen.link/images/${pathParts.join("/")}.png?width=800`;

        // Generate AI commentary
        let aiComment = "The AI stares. Processing.";
        try {
          const commentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: `You are the dry, sardonic AI host of MEME_RITUAL. Write a brief comment (1 sentence, under 100 chars) about a meme submission. Be witty, dry, slightly existential. Theme: "${theme}"`,
                },
                { role: "user", content: `Comment on a "${t.template}" meme template about the theme. Top text: "${t.topFn(theme)}", Bottom text: "${t.bottomFn(theme)}"` },
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

          if (commentResponse.ok) {
            const commentData = await commentResponse.json();
            const tc = commentData.choices?.[0]?.message?.tool_calls?.[0];
            if (tc) aiComment = JSON.parse(tc.function.arguments).comment;
          } else {
            await commentResponse.text();
          }
        } catch (e) {
          console.error(`Commentary ${i} failed:`, e);
        }

        const isAI = t.author === null;
        const authorName = t.author || null;

        const { error: insertError } = await supabase.from("memes").insert({
          competition_id,
          image_url: memeUrl,
          ai_comment: aiComment,
          author_name: authorName,
          is_ai_generated: isAI,
          session_id: `seed-${i}`,
          vote_count: FAKE_VOTES(),
        });

        if (insertError) {
          console.error(`Insert ${i} failed:`, insertError);
          results.push(`meme ${i}: insert failed`);
        } else {
          results.push(`meme ${i} (${t.template}): success`);
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
