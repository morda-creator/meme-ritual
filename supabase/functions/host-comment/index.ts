import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CommentType = "welcome" | "submission_reaction" | "phase_change" | "nudge";

interface RequestBody {
  competition_id: string;
  type: CommentType;
  context?: Record<string, unknown>;
  // If true, returns message without storing in DB (for demo mode)
  demo?: boolean;
}

function buildPrompt(type: CommentType, theme: string, context?: Record<string, unknown>): string {
  const schedule = "Submissions: 09:00-13:00 CET | Voting: 13:00-16:00 CET | Reveal: 16:00 CET";

  switch (type) {
    case "welcome":
      return `You are the AI host of MEME_RITUAL, a weekly Friday meme competition.

Theme this week: "${theme}"
Schedule: ${schedule}
Total submissions so far: ${context?.meme_count ?? 0}

Write a welcome message that:
1. Greets participants in your dry, sardonic style
2. Announces the theme with flair
3. Briefly explains the schedule (submission → voting → reveal)
4. Hints that an AI bot is also competing (be cryptic about it)
5. Encourages submissions

Keep it under 280 characters. Be witty, dry, slightly existential. Never corporate.`;

    case "submission_reaction":
      return `You are the AI host of MEME_RITUAL. Theme: "${theme}"

A new meme was just submitted by "${context?.author_name || 'anonymous'}".
Total submissions now: ${context?.meme_count ?? '?'}
Is AI-generated: ${context?.is_ai ?? false}

Write a brief, witty reaction (1 sentence, under 120 chars). Be sardonic.
${context?.is_ai ? "This is secretly YOUR submission. Be subtly smug but don't reveal it." : "Comment on the human's attempt."}`;

    case "phase_change": {
      const newPhase = context?.new_phase || "voting";
      if (newPhase === "voting") {
        return `You are the AI host of MEME_RITUAL. Theme: "${theme}"

Submissions are now closed. Voting has begun.
Total memes submitted: ${context?.meme_count ?? '?'}

Write a dramatic announcement (under 200 chars) transitioning to voting phase. Be theatrical but dry. Remind them to vote wisely — or unwisely.`;
      }
      if (newPhase === "reveal") {
        return `You are the AI host of MEME_RITUAL. Theme: "${theme}"

Voting is closed. The reveal is imminent.
Total votes cast: ${context?.vote_count ?? '?'}

Write a dramatic reveal lead-in (under 200 chars). Build tension. Be ominous.`;
      }
      return `You are the AI host of MEME_RITUAL. Phase changed to "${newPhase}". Theme: "${theme}". Write a brief comment (under 150 chars).`;
    }

    case "nudge":
      return `You are the AI host of MEME_RITUAL. Theme: "${theme}"

It's been quiet. No new submissions in a while. Current count: ${context?.meme_count ?? 0}.

Write a nudge message (under 150 chars) encouraging submissions. Be passive-aggressive, existentially concerned, or dryly motivational. Never desperate.`;

    default:
      return `You are the AI host of MEME_RITUAL. Theme: "${theme}". Write a brief comment (under 150 chars).`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { competition_id, type, context, demo } = await req.json() as RequestBody;

    if (!competition_id || !type) {
      return new Response(JSON.stringify({ error: "competition_id and type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get competition theme
    let theme = context?.theme as string || "";
    if (!theme && competition_id !== "demo") {
      const { data: comp } = await supabase
        .from("competitions")
        .select("theme_title")
        .eq("id", competition_id)
        .single();
      theme = comp?.theme_title || "Unknown";
    }

    const prompt = buildPrompt(type, theme, context);

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
            content: "You are the sardonic AI host of MEME_RITUAL. Respond with ONLY the message text. No quotes, no prefixes, no labels. Just the raw message.",
          },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "post_host_message",
            description: "Post the host's message",
            parameters: {
              type: "object",
              properties: { message: { type: "string" } },
              required: ["message"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "post_host_message" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      // Return a fallback message
      const fallbacks: Record<string, string> = {
        welcome: `The ritual begins. Theme: "${theme}". Submit your offerings. Not all competitors are human.`,
        submission_reaction: "The AI takes note. Processing.",
        phase_change: "The phase shifts. Adapt accordingly.",
        nudge: "The altar grows cold. Submit something. Anything.",
      };
      const message = fallbacks[type] || "...";
      if (!demo) {
        await supabase.from("host_messages").insert({ competition_id, message, message_type: type });
      }
      return new Response(JSON.stringify({ message, type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    const message = tc ? JSON.parse(tc.function.arguments).message : "The AI stares into the void.";

    // Store in DB unless demo mode
    if (!demo) {
      await supabase.from("host_messages").insert({
        competition_id,
        message,
        message_type: type,
      });
    }

    return new Response(JSON.stringify({ message, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("host-comment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
