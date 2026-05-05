# Plan: Unified Guests view + Schema-aware export

## 1. Flatten the Guests tab UX

**Problem:** Organizer must click Event → Guests → Registrations sub-tab to approve people. Three nested layers is too much.

**Change:** Make the **Guests** tab show the registrations list directly as the primary content. Drop the inner Tabs (Invitations / Registrations / Checked In) and replace with a lightweight filter bar.

In `src/components/events/EventBuilderGuests.tsx`:
- Remove inner `<Tabs>`. Render `<RegistrationsTab>` as the main panel.
- Keep the 4 summary cards (Total / Registered / Checked In / Pending) at top.
- Keep the "Open Scanner" card.
- Add a filter chip row above the list: **All · Pending · Approved · Rejected · Invited · Checked In** (these become a single filter, not separate tabs).
- Move "Invite Guests" into a secondary action button in the header (still opens `InviteGuestsDialog`).
- Move "Invitation History" behind a collapsible "View invitation log" link at the bottom (rarely needed).

In `src/components/events/RegistrationsTab.tsx`:
- Accept an optional `filter` prop (already has internal filter — extend to include `invited` and `checked_in`).
- Fetch all `event_guests` for the event (drop the `registration_type = 'registration'` restriction so invited guests show too) and tag each row with its source (Registration / Invitation) via a small badge.
- Keep approve/reject inline buttons exactly as they are — that part already works well.

Net result: organizer clicks event → Guests tab → sees everyone with approve/reject buttons right there.

## 2. Schema-aware unified export (Google Forms parity)

**Problem:** When an organizer edits the registration form (adds/removes questions) between registrations, the export today only joins on currently active questions. Older registrants who answered now-removed questions, or who never saw a newly added question, lose context.

**Change:** Export ALL questions that have ever existed for the event, union of columns, with empty cells where a registrant didn't answer.

In `src/lib/exportRegistrations.ts`:
- No signature change needed — caller already passes `questions` and `answers`.

In the caller (`EventBuilderInsights.tsx` / wherever export is triggered — currently in insights):
- Fetch questions with `is_active` filter **removed** so deleted/inactive questions are still included as columns.
- Order columns: default fields first, then questions ordered by `sort_order` then `created_at` (stable across edits).
- Append a marker `(removed)` to column header for questions where `is_active = false`, so organizers know it's a legacy question.
- Rows where a guest never answered a question simply emit empty string — already the behavior.

Also add a small **"Export CSV"** button visible directly in the Guests tab header (not just Insights) so organizers don't have to leave the page.

## 3. Out of scope (not changed)

- No DB migration — `event_registration_questions` already preserves rows when deactivated; we just stop filtering them on export.
- Insights page stays as-is.
- Invitations table and dialog stay; just visually demoted.

## Files touched

- `src/components/events/EventBuilderGuests.tsx` — flatten to single view, filter chips, export button.
- `src/components/events/RegistrationsTab.tsx` — broaden fetch to include all guest types, add `invited` / `checked_in` filters, source badge.
- `src/lib/exportRegistrations.ts` — header marker for removed questions (1-line change).
- New small helper to fetch full question history (active + inactive) used by the export action.

Approve to implement.