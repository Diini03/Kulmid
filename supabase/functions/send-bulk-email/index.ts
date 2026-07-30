import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders, sendEmail, emailShell, escapeHtml } from "../_shared/email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_BASE_URL") || "https://kulmidsystembydiini.lovable.app";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

const ALLOWED_AUDIENCES = ["all", "registered", "pending", "waitlisted", "checked_in", "not_checked_in"] as const;
type Audience = (typeof ALLOWED_AUDIENCES)[number];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- auth: only the event organizer (or an admin) may send ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "Not authenticated" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const eventId = typeof body?.eventId === "string" ? body.eventId : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const audience: Audience = ALLOWED_AUDIENCES.includes(body?.audience) ? body.audience : "registered";

    if (!eventId) return json({ error: "Missing eventId" }, 400);
    if (subject.length < 3 || subject.length > 150) return json({ error: "Subject must be 3–150 characters" }, 400);
    if (message.length < 5 || message.length > 5000) return json({ error: "Message must be 5–5000 characters" }, 400);

    const { data: event } = await supabase
      .from("events")
      .select("id, title, created_by, slug, date")
      .eq("id", eventId)
      .maybeSingle();
    if (!event) return json({ error: "Event not found" }, 404);

    let allowed = event.created_by === userId;
    if (!allowed) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      allowed = !!isAdmin;
    }
    if (!allowed) return json({ error: "You are not allowed to email this event's guests" }, 403);

    // ---- rate limit: max 5 bulk sends per event per hour ----
    const bucket = "bulk_email";
    const identifier = `${eventId}`;
    const { data: counter } = await supabase
      .from("rate_limit_counters")
      .select("*")
      .eq("bucket", bucket)
      .eq("identifier", identifier)
      .maybeSingle();

    const hourAgo = new Date(Date.now() - 3600e3);
    if (counter && new Date(counter.window_start) > hourAgo) {
      if (counter.count >= 5) return json({ error: "Send limit reached. Try again in an hour." }, 429);
      await supabase.from("rate_limit_counters").update({ count: counter.count + 1 }).eq("id", counter.id);
    } else if (counter) {
      await supabase.from("rate_limit_counters").update({ count: 1, window_start: new Date().toISOString() }).eq("id", counter.id);
    } else {
      await supabase.from("rate_limit_counters").insert({ bucket, identifier, count: 1 });
    }

    // ---- recipients ----
    let query = supabase
      .from("event_guests")
      .select("id, name, email, status, checked_in, cancel_token")
      .eq("event_id", eventId)
      .neq("status", "cancelled");

    if (audience === "registered") query = query.in("status", ["registered", "approved", "confirmed"]);
    else if (audience === "pending") query = query.eq("status", "pending");
    else if (audience === "waitlisted") query = query.eq("status", "waitlisted");
    else if (audience === "checked_in") query = query.eq("checked_in", true);
    else if (audience === "not_checked_in") query = query.or("checked_in.is.null,checked_in.eq.false");

    const { data: guests } = await query;
    const recipients = (guests || []).filter((g) => !!g.email);
    if (recipients.length === 0) return json({ error: "No guests match that audience." }, 400);

    const paragraphs = message
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");

    let sent = 0;
    let failed = 0;

    for (const guest of recipients) {
      const html = emailShell({
        heading: escapeHtml(subject),
        intro: `A message from the organizer of <strong>${escapeHtml(event.title)}</strong>.`,
        bodyHtml: paragraphs,
        ctaLabel: "View event",
        ctaUrl: `${APP_URL}/event/${event.slug || event.id}`,
        footerNote: `You received this because you registered for ${escapeHtml(event.title)}. <a href="${APP_URL}/r/cancel/${guest.cancel_token}" style="color:#6b7280;">Cancel registration</a>.`,
      });

      try {
        await sendEmail(guest.email, subject, html);
        await supabase.from("email_log").insert({
          event_id: eventId, guest_id: guest.id, recipient: guest.email, kind: "bulk", status: "sent",
        });
        sent++;
      } catch (e) {
        await supabase.from("email_log").insert({
          event_id: eventId, guest_id: guest.id, recipient: guest.email, kind: "bulk", status: "failed",
          error: e instanceof Error ? e.message : String(e),
        });
        failed++;
      }
    }

    return json({ ok: true, sent, failed, total: recipients.length });
  } catch (e) {
    console.error("send-bulk-email error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});