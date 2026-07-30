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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const action = body?.action === "cancel" ? "cancel" : "lookup";

    if (!token || token.length < 8 || token.length > 128) {
      return json({ error: "Invalid cancellation link" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: guest, error } = await supabase
      .from("event_guests")
      .select("id, event_id, name, email, status, cancelled_at, waitlist_position")
      .eq("cancel_token", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!guest) return json({ error: "This cancellation link is no longer valid." }, 404);

    const { data: event } = await supabase
      .from("events")
      .select("id, title, date, location, slug")
      .eq("id", guest.event_id)
      .maybeSingle();

    const payload = {
      registration: {
        name: guest.name,
        email: guest.email,
        status: guest.status,
        cancelled_at: guest.cancelled_at,
        waitlist_position: guest.waitlist_position,
      },
      event: event ?? null,
    };

    if (action === "lookup") return json(payload);

    if (guest.status === "cancelled") {
      return json({ ...payload, alreadyCancelled: true });
    }

    const { error: updateError } = await supabase
      .from("event_guests")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), waitlist_position: null })
      .eq("id", guest.id);

    if (updateError) return json({ error: updateError.message }, 500);

    // Free the spot -> the DB trigger auto-promotes the next person on the waitlist.
    return json({
      ...payload,
      registration: { ...payload.registration, status: "cancelled", cancelled_at: new Date().toISOString() },
      cancelled: true,
    });
  } catch (e) {
    console.error("cancel-registration error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});