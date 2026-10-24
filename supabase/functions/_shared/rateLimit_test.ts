import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { linkState } from "./rateLimit.ts";

const start = "2026-10-01T10:00:00Z";
const end = "2026-10-01T14:00:00Z";
const t = (s: string) => new Date(s).getTime();

Deno.test("cancel link works only before the event starts", () => {
  assertEquals(linkState(start, end, t("2026-10-01T09:59:00Z")).canCancel, true);
  assertEquals(linkState(start, end, t("2026-10-01T10:01:00Z")).canCancel, false);
});
Deno.test("feedback link opens after the event and expires 30 days later", () => {
  assertEquals(linkState(start, end, t("2026-10-01T13:00:00Z")).feedbackOpen, false);
  assertEquals(linkState(start, end, t("2026-10-30T14:00:00Z")).feedbackOpen, true);
  assertEquals(linkState(start, end, t("2026-11-01T14:00:00Z")).feedbackOpen, false);
});
