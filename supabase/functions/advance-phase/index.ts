import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { target_phase } = await req.json().catch(() => ({}));

    const today = new Date().toISOString().split("T")[0];

    const { data: comp } = await supabase
      .from("competitions")
      .select("*")
      .eq("competition_date", today)
      .maybeSingle();

    if (!comp) {
      return new Response(JSON.stringify({ message: "No competition today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the target phase
    const phase = target_phase || getPhaseByTime();
    
    if (comp.status === phase) {
      return new Response(JSON.stringify({ message: `Already in ${phase} phase`, competition_id: comp.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Transitioning competition ${comp.id} from "${comp.status}" to "${phase}"`);

    // Handle reveal phase: pick winner and generate announcement
    if (phase === "reveal" && !comp.winner_meme_id) {
      const { data: topMeme } = await supabase
        .from("memes")
        .select("*")
        .eq("competition_id", comp.id)
        .order("vote_count", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topMeme) {
        // Generate winner announcement via announce-winner function
        let announcement = "Against all odds, this meme has won. Humanity remains undefeated. For now.";
        try {
          const { data: totalMemes } = await supabase
            .from("memes")
            .select("*", { count: "exact", head: true })
            .eq("competition_id", comp.id);

          const { data: totalVotes } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .in("meme_id", (await supabase.from("memes").select("id").eq("competition_id", comp.id)).data?.map(m => m.id) || []);

          const announceResponse = await fetch(`${supabaseUrl}/functions/v1/announce-winner`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              theme: comp.theme_title,
              winnerDescription: `A ${topMeme.is_ai_generated ? "bot-generated" : "human-submitted"} meme with ${topMeme.vote_count} votes. AI comment: "${topMeme.ai_comment}"`,
              totalMemes: totalMemes,
              totalVotes: totalVotes,
            }),
          });

          if (announceResponse.ok) {
            const announceData = await announceResponse.json();
            announcement = announceData.announcement || announcement;
          }
        } catch (e) {
          console.error("Announcement generation failed (non-fatal):", e);
        }

        await supabase
          .from("competitions")
          .update({
            status: "reveal",
            winner_meme_id: topMeme.id,
            winner_announcement: announcement,
          })
          .eq("id", comp.id);

        return new Response(JSON.stringify({
          message: `Transitioned to reveal phase`,
          winner_id: topMeme.id,
          winner_votes: topMeme.vote_count,
          announcement,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Simple status update for submission/voting
    await supabase
      .from("competitions")
      .update({ status: phase })
      .eq("id", comp.id);

    return new Response(JSON.stringify({
      message: `Transitioned to ${phase} phase`,
      competition_id: comp.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("advance-phase error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getPhaseByTime(): string {
  const now = new Date();
  const hour = now.getUTCHours(); // UTC
  // Submission: 09:00-13:00 CET (08:00-12:00 UTC)
  // Voting: 13:00-16:00 CET (12:00-15:00 UTC)
  // Reveal: after 16:00 CET (15:00 UTC)
  if (hour < 8) return "preparing";
  if (hour < 12) return "submission";
  if (hour < 15) return "voting";
  return "reveal";
}
