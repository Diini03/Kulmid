import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

/**
 * Public post-event feedback endpoint.
 * The attendee is identified by the per-registration token that already ships
 * in their emails — no account required.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const action = body?.action === "submit" ? "submit" : "lookup";

    if (!token || token.length < 8 || token.length > 128) {
      return json({ error: "Invalid feedback link" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: guest } = await supabase
      .from("event_guests")
      .select("id, event_id, name, email, status, checked_in")
      .eq("cancel_token", token)
      .maybeSingle();

    if (!guest) return json({ error: "This feedback link is no longer valid." }, 404);

    const { data: event } = await supabase
      .from("events")
      .select("id, title, date, end_date, location, slug, image_url")
      .eq("id", guest.event_id)
      .maybeSingle();

    if (!event) return json({ error: "Event not found" }, 404);

    const { data: existing } = await supabase
      .from("event_feedback")
      .select("id, rating, comment, would_recommend, created_at")
      .eq("guest_id", guest.id)
      .maybeSingle();

    const payload = {
      event,
      guest: { name: guest.name, email: guest.email },
      existing: existing ?? null,
    };

    if (action === "lookup") return json(payload);

    // ---- submit ----
    const eventEnd = new Date(event.end_date || event.date);
    if (eventEnd.getTime() > Date.now()) {
      return json({ error: "Feedback opens after the event has finished." }, 400);
    }
    if (existing) return json({ ...payload, alreadySubmitted: true });

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ error: "Please choose a rating from 1 to 5." }, 400);
    }

    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : null;
    const wouldRecommend = typeof body?.would_recommend === "boolean" ? body.would_recommend : null;

    const { error: insertError } = await supabase.from("event_feedback").insert({
      event_id: event.id,
      guest_id: guest.id,
      rating,
      comment: comment || null,
      would_recommend: wouldRecommend,
    });

    if (insertError) return json({ error: insertError.message }, 500);

    return json({ ...payload, submitted: true });
  } catch (e) {
    console.error("event-feedback error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
