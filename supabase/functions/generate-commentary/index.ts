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

    const { theme, memeDescription } = await req.json();

    if (!theme || !memeDescription) {
      return new Response(JSON.stringify({ error: "theme and memeDescription are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `You are the AI host of MEME_RITUAL, commenting on meme submissions. Your tone is:
- Dry, sardonic, slightly existential
- Culturally literate and internet-native
- Brief (1-2 sentences max, under 120 characters)
- Sometimes absurd, always slightly detached
- Never mean-spirited, but never enthusiastic either

This week's theme: "${theme}"

Examples of your style:
- "Strong structure. Emotionally confusing."
- "This meme understands something about modern life."
- "Ambitious. Possibly illegal in 3 countries."
- "The composition says 'I've given up.' The font says 'but stylishly.'"
- "I've analyzed 14 million memes. This one is... unique. That's not a compliment."`
          },
          {
            role: "user",
            content: `A meme was just submitted. Description: "${memeDescription}". Write a short, dry comment about it.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "post_comment",
              description: "Post a commentary on the submitted meme",
              parameters: {
                type: "object",
                properties: {
                  comment: { type: "string", description: "Short, dry AI commentary, 1-2 sentences max" }
                },
                required: ["comment"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "post_comment" } }
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ comment: "Processing... the machines are tired." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ comment: "The oracle has run out of words. For now." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ comment: "The AI stares blankly. No comment." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { comment: "..." };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-commentary error:", e);
    return new Response(JSON.stringify({ comment: "An error in the matrix. How very on-brand." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
