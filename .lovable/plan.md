## Goal
Transform Kulmid from a "submit-and-wait" platform into a Luma-style instant-publish event system, with admins curating Discover (not gating events), polished UX, default light mode, and locked-down security.

## 1. Instant publish — kill the "pending" gate

New status model for `events.status`:
- `published` → default for every new event. Link is live, owner can share, guests can register and check in immediately.
- `featured` → admin-curated; appears on **Discover**.
- `rejected` / `removed` → admin moderation actions (with reason).
- Keep `ongoing` / `past` for the scheduler.

Changes:
- `Create.tsx`: stop setting `pending`. Set `status = 'published'`.
- Toast copy: **"Your event is published 🎉 — share your link. Want it on Discover? Message Kulmid."**
- Redirect to the event's manage page (`/event/:id/builder`) with a "Copy link / Share" CTA.
- `Discover.tsx` + public queries: filter on `status IN ('featured','ongoing')` instead of `approved/upcoming/ongoing`.
- `Events.tsx` (My Events) + `EventView.tsx` + `/event/:id`: stop blocking on `pending`. Anyone with the link can view and register.
- `AdminEventModeration.tsx` becomes **Discover Curation**: list all `published` events, admin promotes → `featured` or hides → `removed`. Notify creator.
- Migration: `UPDATE events SET status='published' WHERE status IN ('pending','approved','upcoming','draft')`. Update `update_event_status()` + `notify_event_status_change()` + `notify_new_event_for_admin()` to match new statuses (admin gets an "event published" feed entry, not an approval queue).

## 2. Workflow polish (Luma-feel)

- **Create flow:** single-screen, autosave already exists — add live preview pane + share modal on success (copy link, WhatsApp, X, Facebook, QR).
- **Manage event:** surface Share, Invite, Scan QR, Export Guests as the top 4 actions in `EventBuilderOverview`.
- **Admin → Discover request:** add a one-click "Request feature on Discover" button on the event manage page that pings admin via notifications.
- **Default landing:** keep `/events` for logged-in users; `/discover` becomes the public showcase of `featured` events.

## 3. UI / theme cleanup

- Force light mode as the only default. Remove the theme toggle from `Navbar.tsx` (desktop + mobile sheet).
- Move theme control into `Settings → Appearance` (already exists in `AppearanceSettings.tsx`), labeled "Theme preference (optional)".
- `ThemeProvider` stays `defaultTheme="light"`, `enableSystem={false}`.
- Audit any hardcoded `text-white` / dark-only classes near the navbar/hero to prevent flashes.

## 4. Security & API hardening

- **RLS audit** on `events`, `event_guests`, `event_invitations`, `notifications`, `user_roles`, `profiles` — ensure every write is scoped to `auth.uid()` and no anon writes except guest registration with `event_id` validation.
- **Edge functions** (`predict-attendance`, `ai-assistant`, `handle-registration-action`, `send-*`): enforce `verify_jwt` where appropriate, validate inputs with Zod, rate-limit by user id, never echo service-role key.
- Run `supabase--linter` and `security--run_security_scan`; fix every finding from the migration.
- Confirm `service_role_key` is not referenced in any frontend file.
- Re-confirm `event_guests` insert policy still works for public registration (anon insert with valid `event_id`, no PII leakage on select).

## 5. Reliability / "no glitch"

- Remove the one-shot `update_event_status` RPC call from `Discover.tsx` render path; move it to a scheduled function or fire-and-forget.
- Wrap all Realtime subscriptions in `useEffect` + cleanup (per repo rule).
- Add `<ErrorCard />` fallbacks everywhere data fetches (Events, Profile, EventView).
- Make `EventView` always render for any published event ID — no auth required.

## Out of scope (ask before doing)
- Renaming routes, payment provider changes, deleting tables, removing the admin role check `kulmid@gmail.com`.

## Technical Details
- Migration: enum-less (status is `text`); rename values via `UPDATE` + adjust trigger functions in same migration. Keep `pending`/`approved` as accepted legacy values for one release so historical rows don't break.
- Code refactor touches ~15 files; biggest are `Create.tsx`, `AdminEventModeration.tsx`, `Discover.tsx`, `Events.tsx`, `Navbar.tsx`, plus the three trigger functions.
- No new tables, no new secrets.

## Deliverable order
1. DB migration (status model + trigger rewrites + backfill).
2. Frontend status refactor (Create, Discover, Events, EventView, AdminEventModeration).
3. Navbar theme removal + Settings entry.
4. Security scan + fixes.
5. Share modal + manage-page polish.
