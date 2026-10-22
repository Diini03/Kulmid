import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ownedEventRef } from "./organizer-context.ts";

Deno.test("management routes scope organizer questions to the selected event", () => {
  assertEquals(ownedEventRef("/events/ev-123/manage"), "ev-123");
  assertEquals(ownedEventRef("/event/ev-456/builder"), "ev-456");
});
Deno.test("public and unrelated routes do not claim organizer event scope", () => {
  assertEquals(ownedEventRef("/event/public-slug"), null);
  assertEquals(ownedEventRef("/events"), null);
  assertEquals(ownedEventRef("/events/ev-123/manage/other"), null);
});