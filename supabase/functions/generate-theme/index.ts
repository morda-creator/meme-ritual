import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Guard: only allow competition creation on Fridays
    const now = new Date();
    if (now.getUTCDay() !== 5) {
      return new Response(JSON.stringify({ error: "Rituals only happen on Fridays." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if today's competition already exists
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("competitions")
      .select("*")
      .eq("competition_date", today)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate theme via AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are the host of MEME_RITUAL, a weekly meme competition. Your tone is:
- Dry, witty, slightly sarcastic
- Culturally aware and internet-native
- A bit absurd and existential
- Never corporate or overly excited

Generate a weekly meme theme. The theme should reference current cultural moments, tech trends, internet culture, or absurd observations about modern life. Be specific and funny.`
          },
          {
            role: "user",
            content: "Generate this week's meme competition theme. Make it topical, sharp, and slightly unhinged."
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_theme",
              description: "Set the weekly meme competition theme",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short theme title, 3-8 words" },
                  intro: { type: "string", description: "1-2 sentence sardonic intro, under 200 chars" }
                },
                required: ["title", "intro"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "set_theme" } }
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. The ritual requires patience." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Even rituals have costs." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const theme = JSON.parse(toolCall.function.arguments);

    // Create competition in DB using service role (bypasses RLS)
    const { data: competition, error: insertError } = await supabase
      .from("competitions")
      .insert({
        theme_title: theme.title,
        theme_intro: theme.intro,
        status: "submission",
        competition_date: today,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create competition");
    }

    // Fire-and-forget bot submissions (don't await — avoid timeout)
    try {
      console.log("Triggering bot-submit for competition:", competition.id);
      fetch(`${supabaseUrl}/functions/v1/bot-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ competition_id: competition.id }),
      }); // intentionally not awaited
    } catch (seedErr) {
      console.error("Bot-submit trigger failed (non-fatal):", seedErr);
    }

    return new Response(JSON.stringify(competition), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-theme error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
