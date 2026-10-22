import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const ownedEventRef = (page: string) => {
  const match = page.match(/^\/(?:events\/([^/?#]+)\/manage|event\/([^/?#]+)\/builder)\/?$/);
  return match?.[1] || match?.[2] || null;
};

export async function loadOrganizerContext(sb: SupabaseClient, userId: string, page: string) {
  const ref = ownedEventRef(page);
  let query = sb.from("events").select("id,title,date,status,max_attendees")
    .eq("created_by", userId).order("date", { ascending: false }).limit(20);
  if (ref) query = query.eq("id", ref);
  const { data: events, error } = await query;
  if (error) return "Private event statistics could not be loaded. Do not infer any totals.";
  if (!events?.length) return "No owned events found in this scope. Do not use public events as the user's events.";

  const summaries = [];
  for (const event of events) {
    const count = async (status?: string, checkedIn = false) => {
      let q = sb.from("event_guests").select("id", { count: "exact", head: true })
        .eq("event_id", event.id).eq("registration_type", "registration");
      if (status) q = q.eq("status", status);
      if (checkedIn) q = q.eq("checked_in", true);
      const result = await q;
      return result.error ? null : result.count;
    };
    const [total, confirmed, registered, approved, pending, waitlisted, cancelled, checkedIn] =
      await Promise.all([count(), count("confirmed"), count("registered"), count("approved"),
        count("pending"), count("waitlisted"), count("cancelled"), count(undefined, true)]);
    summaries.push({ title: event.title, date: event.date, status: event.status,
      capacity: event.max_attendees ?? "unlimited", totalSubmissions: total,
      statusCounts: { confirmed, registered, approved, pending, waitlisted, cancelled }, checkedIn,
      manageLink: `/events/${event.id}/manage` });
  }
  return JSON.stringify({ scope: ref ? "current owned event" : "latest 20 owned events, not lifetime totals",
    definition: "Registration submissions only; cancelled and waitlisted are included in total submissions. Checked-in is the checked_in flag. Null means unavailable. No individual attendee details are provided.",
    events: summaries });
}