import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { loadOrganizerContext, ownedEventRef } from "./organizer-context.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.test("management routes scope organizer questions to the selected event", () => {
  assertEquals(ownedEventRef("/events/ev-123/manage"), "ev-123");
  assertEquals(ownedEventRef("/event/ev-456/builder"), "ev-456");
});
Deno.test("public and unrelated routes do not claim organizer event scope", () => {
  assertEquals(ownedEventRef("/event/public-slug"), null);
  assertEquals(ownedEventRef("/events"), null);
  assertEquals(ownedEventRef("/events/ev-123/manage/other"), null);
});

Deno.test("private context filters by authenticated owner and counts beyond 1000 without attendee fields", async () => {
  const urls: URL[] = [];
  const client = createClient("https://example.supabase.co", "test-anon-key", {
    auth: { persistSession: false },
    global: { fetch: async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      urls.push(url);
      if (url.pathname.endsWith("/events")) {
        assertEquals(url.searchParams.get("created_by"), "eq.owner-123");
        assertEquals(url.searchParams.get("id"), "eq.ev-123");
        return new Response(JSON.stringify([{ id: "ev-123", title: "Owned event", date: "2026-10-22", status: "published", max_attendees: 2000 }]), { headers: { "Content-Type": "application/json" } });
      }
      assertEquals(init?.method, "HEAD");
      assertEquals(url.searchParams.get("event_id"), "eq.ev-123");
      assertEquals(url.searchParams.get("registration_type"), "eq.registration");
      assertEquals(url.searchParams.get("select"), "id");
      return new Response(null, { headers: { "Content-Range": "0-1500/1501" } });
    } },
  });
  const context = JSON.parse(await loadOrganizerContext(client, "owner-123", "/events/ev-123/manage"));
  assertEquals(context.events[0].totalSubmissions, 1501);
  assertEquals(context.events[0].checkedIn, 1501);
  assertEquals(urls.length, 9);
});