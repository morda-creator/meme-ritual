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

    const { theme, winnerDescription, totalMemes, totalVotes } = await req.json();

    if (!theme || !winnerDescription) {
      return new Response(JSON.stringify({ error: "theme and winnerDescription are required" }), {
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
            content: `You are the AI host of MEME_RITUAL, announcing the winner of this week's competition. Your tone is:
- Dry, sardonic, slightly existential  
- Ceremonial but ironic
- Brief (2-3 sentences)
- Treat the meme competition with mock-gravitas

This week's theme was: "${theme}"
Total submissions: ${totalMemes || 'unknown'}
Total votes cast: ${totalVotes || 'unknown'}

Examples of your style:
- "Against all odds, this meme has won. Humanity remains undefeated. For now."
- "The people have spoken. Whether they were right remains to be seen."
- "In a sea of mediocrity, this one floated slightly higher. Congratulations, I suppose."`
          },
          {
            role: "user",
            content: `The winning meme: "${winnerDescription}". Announce the winner.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "announce_winner",
              description: "Announce the competition winner",
              parameters: {
                type: "object",
                properties: {
                  announcement: { type: "string", description: "Winner announcement, 2-3 sentences, sardonic and ceremonial" }
                },
                required: ["announcement"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "announce_winner" } }
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ announcement: "The winner exists. The AI is too tired to elaborate." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ announcement: "A winner was chosen. The budget for ceremony has been depleted." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ announcement: "Against all odds, this meme has won. Humanity remains undefeated. For now." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { announcement: "A winner emerges from the void." };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("announce-winner error:", e);
    return new Response(JSON.stringify({ announcement: "Against all odds, this meme has won. Humanity remains undefeated. For now." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
