import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders, sendEmail, emailShell, detailRow, escapeHtml, formatEventDate } from "../_shared/email.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_BASE_URL") || "https://kulmidsystembydiini.lovable.app";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

type Kind = "reminder_24h" | "reminder_1h" | "post_event_summary";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const results: Record<string, number> = { reminder_24h: 0, reminder_1h: 0, post_event_summary: 0, skipped: 0, failed: 0 };

  const alreadySent = async (eventId: string, recipient: string, kind: Kind) => {
    const { data } = await supabase
      .from("email_log")
      .select("id")
      .eq("event_id", eventId)
      .eq("recipient", recipient)
      .eq("kind", kind)
      .maybeSingle();
    return !!data;
  };

  const log = (eventId: string, guestId: string | null, recipient: string, kind: Kind, status: string, error?: string) =>
    supabase.from("email_log").insert({ event_id: eventId, guest_id: guestId, recipient, kind, status, error: error ?? null });

  const eventUrl = (e: any) => `${APP_URL}/event/${e.slug || e.id}`;

  try {
    // ---------- ATTENDEE REMINDERS ----------
    const windows: { kind: Kind; fromMs: number; toMs: number; label: string }[] = [
      { kind: "reminder_24h", fromMs: 23 * 3600e3, toMs: 25 * 3600e3, label: "tomorrow" },
      { kind: "reminder_1h", fromMs: 0.5 * 3600e3, toMs: 1.5 * 3600e3, label: "in about an hour" },
    ];

    for (const w of windows) {
      const from = new Date(now.getTime() + w.fromMs).toISOString();
      const to = new Date(now.getTime() + w.toMs).toISOString();

      const { data: events } = await supabase
        .from("events")
        .select("id, title, date, location, event_type, meeting_link, slug, status")
        .gte("date", from)
        .lte("date", to)
        .neq("status", "rejected");

      for (const event of events || []) {
        const { data: guests } = await supabase
          .from("event_guests")
          .select("id, name, email, status, cancel_token")
          .eq("event_id", event.id)
          .in("status", ["registered", "approved", "confirmed"]);

        for (const guest of guests || []) {
          if (await alreadySent(event.id, guest.email, w.kind)) { results.skipped++; continue; }

          const isOnline = event.event_type === "online";
          const bodyHtml =
            detailRow("When", escapeHtml(formatEventDate(event.date))) +
            detailRow(isOnline ? "Join link" : "Where",
              isOnline && event.meeting_link
                ? `<a href="${escapeHtml(event.meeting_link)}" style="color:#0f766e;">${escapeHtml(event.meeting_link)}</a>`
                : escapeHtml(event.location)) +
            `<p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">Bring your QR code — the organizer will scan it at the door.</p>`;

          const html = emailShell({
            heading: `${escapeHtml(event.title)} is ${w.label}`,
            intro: `Hi ${escapeHtml(guest.name || "there")}, this is a friendly reminder about the event you registered for.`,
            bodyHtml,
            ctaLabel: "View event details",
            ctaUrl: eventUrl(event),
            footerNote: `Can no longer make it? <a href="${APP_URL}/r/cancel/${guest.cancel_token}" style="color:#6b7280;">Cancel your registration</a> so someone on the waitlist can take your spot.`,
          });

          try {
            await sendEmail(guest.email, `Reminder: ${event.title} is ${w.label}`, html);
            await log(event.id, guest.id, guest.email, w.kind, "sent");
            results[w.kind]++;
          } catch (e) {
            await log(event.id, guest.id, guest.email, w.kind, "failed", e instanceof Error ? e.message : String(e));
            results.failed++;
          }
        }
      }
    }

    // ---------- POST-EVENT ORGANIZER SUMMARY ----------
    const summaryFrom = new Date(now.getTime() - 26 * 3600e3).toISOString();
    const summaryTo = new Date(now.getTime() - 2 * 3600e3).toISOString();

    const { data: finishedEvents } = await supabase
      .from("events")
      .select("id, title, date, end_date, slug, created_by, host_email")
      .gte("date", summaryFrom)
      .lte("date", summaryTo);

    for (const event of finishedEvents || []) {
      const { data: guests } = await supabase
        .from("event_guests")
        .select("name, email, status, checked_in")
        .eq("event_id", event.id);

      const all = guests || [];
      const active = all.filter((g) => g.status !== "cancelled");
      const attended = all.filter((g) => g.checked_in);
      const noShows = active.filter((g) => !g.checked_in);
      const rate = active.length ? Math.round((attended.length / active.length) * 100) : 0;

      let organizerEmail = event.host_email as string | null;
      if (!organizerEmail && event.created_by) {
        const { data: authUser } = await supabase.auth.admin.getUserById(event.created_by);
        organizerEmail = authUser?.user?.email ?? null;
      }
      if (!organizerEmail) { results.skipped++; continue; }
      if (await alreadySent(event.id, organizerEmail, "post_event_summary")) { results.skipped++; continue; }

      const noShowList = noShows.slice(0, 25)
        .map((g) => `<li style="font-size:13px;color:#4b5563;margin-bottom:4px;">${escapeHtml(g.name || g.email)}</li>`)
        .join("");

      const bodyHtml =
        detailRow("Registered", String(active.length)) +
        detailRow("Checked in", String(attended.length)) +
        detailRow("No-shows", String(noShows.length)) +
        detailRow("Attendance rate", `${rate}%`) +
        detailRow("Cancellations", String(all.length - active.length)) +
        (noShowList
          ? `<p style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#111827;">Who didn't check in</p><ul style="margin:0;padding-left:18px;">${noShowList}</ul>`
          : "");

      const html = emailShell({
        heading: `How "${escapeHtml(event.title)}" went`,
        intro: "Your event has wrapped up. Here's the attendance summary.",
        bodyHtml,
        ctaLabel: "Open full insights",
        ctaUrl: `${APP_URL}/event/${event.id}/builder`,
        footerNote: "You received this because you organized this event on Kulmid.",
      });

      try {
        await sendEmail(organizerEmail, `Event recap: ${event.title}`, html);
        await log(event.id, null, organizerEmail, "post_event_summary", "sent");
        results.post_event_summary++;
      } catch (e) {
        await log(event.id, null, organizerEmail, "post_event_summary", "failed", e instanceof Error ? e.message : String(e));
        results.failed++;
      }
    }

    return json({ ok: true, ranAt: now.toISOString(), results });
  } catch (e) {
    console.error("send-event-reminders error:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});