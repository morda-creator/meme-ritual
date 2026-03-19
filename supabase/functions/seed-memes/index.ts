import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEME_PROMPTS = [
  "classic drake hotline bling two-panel meme with text",
  "this is fine dog sitting in burning room meme",
  "distracted boyfriend meme with three people",
];

const FAKE_AUTHORS = ["entropy_enjoyer", "ctrl_alt_defeat", null]; // null = AI bot

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

    // Get competition theme
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

    // Generate memes sequentially to avoid rate limits
    for (let i = 0; i < MEME_PROMPTS.length; i++) {
      try {
        // Generate meme image
        const imagePrompt = `Create a funny internet meme about "${comp.theme_title}". Use the style of a ${MEME_PROMPTS[i]}. Include funny text overlay that relates to the theme. The meme should be absurd, dry humor, internet-culture style. White impact font text.`;

        const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!imgResponse.ok) {
          const t = await imgResponse.text();
          console.error(`Image gen ${i} failed: ${imgResponse.status}`, t);
          results.push(`meme ${i}: image gen failed`);
          continue;
        }

        const imgData = await imgResponse.json();
        const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!base64Url) {
          results.push(`meme ${i}: no image in response`);
          continue;
        }

        // Convert base64 to file and upload
        const base64Data = base64Url.split(",")[1];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const fileName = `seed-${competition_id.slice(0, 8)}-${i}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("memes")
          .upload(fileName, binaryData, { contentType: "image/png" });

        if (uploadError) {
          console.error(`Upload ${i} failed:`, uploadError);
          results.push(`meme ${i}: upload failed`);
          continue;
        }

        const { data: urlData } = supabase.storage.from("memes").getPublicUrl(fileName);

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
                  content: `You are the dry, sardonic AI host of MEME_RITUAL. Write a brief comment (1 sentence, under 100 chars) about a meme submission. Be witty, dry, slightly existential. Theme: "${comp.theme_title}"`,
                },
                { role: "user", content: `Comment on meme #${i + 1}, a ${MEME_PROMPTS[i]} about the theme.` },
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
            await commentResponse.text(); // consume body
          }
        } catch (e) {
          console.error(`Commentary ${i} failed:`, e);
        }

        const isAI = FAKE_AUTHORS[i] === null;
        const authorName = FAKE_AUTHORS[i] || null;
        const fakeVotes = Math.floor(Math.random() * 30) + 3;

        // Insert meme
        const { error: insertError } = await supabase.from("memes").insert({
          competition_id,
          image_url: urlData.publicUrl,
          ai_comment: aiComment,
          author_name: authorName,
          is_ai_generated: isAI,
          session_id: `seed-${i}`,
          vote_count: fakeVotes,
        });

        if (insertError) {
          console.error(`Insert ${i} failed:`, insertError);
          results.push(`meme ${i}: insert failed`);
        } else {
          results.push(`meme ${i}: success`);
        }

        // Small delay between generations
        if (i < MEME_PROMPTS.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (e) {
        console.error(`Meme ${i} error:`, e);
        results.push(`meme ${i}: error`);
      }
    }

    return new Response(JSON.stringify({ results, competition: comp.theme_title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-memes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
