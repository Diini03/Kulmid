# Admin Event Management + Guides

## 1. Admin event management upgrades

The admin events area still reflects the old approval model. Verified issues:

- `/admin/events` filter tabs are `All / Pending / Approved / Rejected / Draft / Past`, but events now publish as `published` and admins curate with `featured`. The tabs no longer match reality — a "Featured" tab is missing and "Pending/Approved" are largely empty.
- The sidebar item "Event Moderation" points to `/admin/events/pending`, and its badge counts every `published`/`pending` event — so the badge shows the whole catalog, not a real queue.
- `/admin/events` loads every column of every event plus every row of `event_guests` on each visit to compute counts client-side.

Changes:

- Retab All Events to: **All / Featured / Live / Rejected / Draft / Past**, with accurate counts per tab.
- Add row actions matching the new model: Feature / Unfeature, Reject (with reason), View public page, Open organizer builder, Delete.
- Add bulk selection with checkboxes: feature, unfeature, and delete multiple events at once.
- Rename the sidebar entry to **Curation** and change its badge to count only events that are live but not yet featured (a real, actionable queue).
- Add sortable columns (date, registrations, created) and a quick stat strip on top: total, featured, live, past, total registrations.
- Fetch only needed columns and compute per-event registration counts with a single grouped query instead of loading all guest rows.

## 2. In-product guides (no UI redesign)

Add a lightweight guide layer that doesn't touch existing layouts:

- New route `/guides` — an index of short how-to pages, styled with existing cards (same look as Help).
- New route `/guides/:slug` with the initial set:
  - **Create your first event** — step by step from `/create` through capacity, registration window, publishing and sharing the link.
  - **Build your registration form** — field toggles, question types, editing after people have registered.
  - **Approve guests and check people in** — unified Guests tab, bulk approve, QR scanner, expiry rules.
  - **Read your Insights** — smart highlights, per-question charts, CSV/Excel export.
  - **Use the AI assistant** — what it can do today: generate event descriptions, answer platform questions from the chat widget, help word invitations and bulk emails.
- Entry points, all plain text links — no floating buttons or arrows:
  - A "Guides" link in the footer next to Help.
  - A small "New here? Read the guide" text link at the top of `/create` and in the Registration tab header of the event builder, each deep-linking to the relevant guide.
  - A "Guides" section card on the Help page.

Each guide page gets proper `Seo` title/description and a "Next guide" link at the bottom.

## Technical notes

- Guide content lives in one typed data file (`src/data/guides.ts`) so pages stay markup-free and easy to extend; two components render index and detail.
- Admin table changes stay inside `AdminAllEvents.tsx`, `AdminEventModeration.tsx`, `AdminLayout.tsx`, and `AdminBadgesContext.tsx`.
- Status writes continue to use existing `events.status` values (`published`, `featured`, `rejected`, `draft`) — no migration needed.
- Admin actions (feature/unfeature/reject/delete) are written to `admin_audit_log` via the existing audit helper.