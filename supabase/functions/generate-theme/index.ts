import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

Generate a weekly meme theme. Return ONLY valid JSON with this exact format:
{"title": "short theme title", "intro": "1-2 sentence sardonic introduction to the theme"}

The theme should reference current cultural moments, tech trends, internet culture, or absurd observations about modern life. Be specific and funny.`
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

    return new Response(JSON.stringify(theme), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-theme error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
