
# Plan: Categories backend + Modern Event Page + Datetime Picker

Three connected upgrades, plus a short list of "what's missing" polish you should approve.

---

## 1) Admin Categories — make them real (DB-backed, system-wide)

**Problem today:** `AdminCategories.tsx` keeps categories in local React state, and the rest of the app reads from the hardcoded `src/constants/categories.ts`. So nothing the admin does actually saves or shows up anywhere — Create page, EventCard, Discover filters, and analytics all use the static list.

**Fix:**

**a. New table `categories`** (migration)
- Fields: `name` (unique), `slug` (unique), `icon` (lucide name), `color` (gradient class), `description`, `is_active`, `sort_order`
- RLS: anyone can SELECT active rows; only admins can INSERT/UPDATE/DELETE
- Seed it with the current 6 defaults so nothing breaks

**b. New hook `useCategories()`**
- Fetches active categories from DB with React Query
- Replaces every import of `src/constants/categories.ts` across:
  `EventView.tsx`, `EventDetails.tsx`, `Discover.tsx`, `Create.tsx`, `EventForm.tsx`, `EventBuilderEdit.tsx`
- Old constants file kept only as a type export (`EventCategory = string`) — no hardcoded array

**c. Rewrite `AdminCategories.tsx`**
- All CRUD hits Supabase (create, edit, toggle active, delete, drag-reorder updates `sort_order`)
- Optimistic UI + toast on success/error
- Bigger icon picker (full lucide icon search, ~40 curated options instead of 6)
- Confirms before delete if any event currently uses it (count query)

**d. Analytics auto-pickup**
- `CategoryDistributionChart`, `TopCategoriesList`, `insightsCategorizer` all read from the live `categories` table, so a newly added category shows up in charts the moment an event uses it. No hardcoded keys.

---

## 2) Public Event Page (`EventView.tsx`) — modern redesign, light-only

**Locked light mode for this page** regardless of user theme: wrap the route in a `<div className="light">` + `bg-background` so even if a user enables dark in Settings, the public share page stays clean white/gray.

**New layout (desktop, 12-col):**

```text
┌─────────────────────────────────────────────────────────────┐
│  [< Back]                                       [Share]     │
├──────────────────┬──────────────────────────────────────────┤
│  IMAGE (4/12)    │  Category · Type badges                  │
│  rounded-2xl     │  H1 Title                                │
│  aspect-[4/3]    │  📅 Date  ·  📍 Location  ·  💰 Price    │
│  shadow-lg       │                                          │
│                  │  ┌────────────────────────────────────┐  │
│  ── Hosted by ── │  │ CAPACITY  ◉ 12 / 50 spots         │  │
│  [Avatar]        │  │ ████████░░░░░░░░░░░  24%          │  │
│  Host Name       │  │ 38 spots left · Closing in 3 days │  │
│  Contact info    │  └────────────────────────────────────┘  │
│                  │                                          │
│                  │  [  Register for this event  ]  ← teal   │
│                  │                                          │
│                  │  ── Who's going (avatars) ──             │
│                  │  ●●●●● +27 attending                     │
│                  │                                          │
│                  │  About this event                        │
│                  │  Long description...                     │
└──────────────────┴──────────────────────────────────────────┘
```

**Specific upgrades vs. current page:**
- **Always-visible capacity card** with progress bar + "X spots left" pill + urgency line ("Closing in 3 days" / "Almost full")
- **"Who's going" strip**: avatar stack of approved registrants (first 5) + "+N attending" — pulls from `event_guests` where `status in ('registered','approved')`. Builds trust + social proof.
- **Host card redesigned**: avatar, name, short bio, optional verified badge, social links — feels like a person, not a field dump
- **Sticky right-rail CTA** on desktop, sticky bottom bar on mobile (already exists, polish styling)
- **Tighter meta row** (date/location/price inline with icons, no 3 big cards)
- **Image**: smaller, left-aligned, `aspect-[4/3]`, soft shadow — no full-bleed hero
- **Microcopy**: "Free event" instead of "$0", "Online event" with meeting badge if virtual

**Out of scope:** no schema changes for this section, just SELECT from existing `event_guests` for the "who's going" strip.

---

## 3) Create Event — modern Date & Time picker

**Problem:** `Create.tsx` lines 609 + 627 use native `<input type="datetime-local">` — browser-default, ugly, inconsistent across browsers.

**Fix:** Build a small `<DateTimePicker>` component:
- shadcn `Popover` + `Calendar` (date) + custom time grid (hour/minute selectors with 15-min steps)
- Trigger button shows formatted "May 28, 2026 · 6:30 PM" with calendar icon
- `pointer-events-auto` on the calendar wrapper (per shadcn rule)
- Used in Create (start + end date) and in `EventBuilderEdit.tsx` so the whole app is consistent
- Validates end ≥ start; show inline error

---

## 4) What you're missing (my recommendations)

Approve any of these and I'll fold them in:

1. **Closing-soon urgency** on EventView: red-tinted pill when <48h to registration deadline or <5 spots left
2. **OG image meta tags** on EventView so shared links on WhatsApp/Twitter render the event cover (huge for sharing in Somalia)
3. **"Add to Calendar" button** (Google / Apple `.ics` download) next to Register — standard on every modern event platform
4. **Map preview** for in-person events: small embedded map below location (improves trust)
5. **Category color tokens** stored on the category row, so EventCard badges actually use each category's color (currently all use the same gradient)
6. **Empty-state on AdminCategories** when no categories yet
7. **Lock dark mode out of all public, unauthenticated pages** (EventView, SignIn, SignUp, Welcome) — not just EventView — so brand stays consistent

---

## Technical summary

**Migration:** new `categories` table + seed + RLS (admin write, public read active)
**New files:**
- `src/hooks/useCategories.ts`
- `src/components/ui/datetime-picker.tsx`
**Rewritten:** `src/pages/admin/AdminCategories.tsx`
**Edited:** `EventView.tsx`, `Create.tsx`, `EventBuilderEdit.tsx`, `EventForm.tsx`, `Discover.tsx`, `EventCard.tsx`, `EventDetails.tsx`, analytics components that read categories
**Light-mode lock:** route-level `.light` wrapper on EventView (and optionally other public pages per #7)

---

**Questions before I build:**
1. For "Who's going", should anonymous registrants show as initials only, or hide entirely if their profile is private?
2. Should the new datetime picker also replace the date inputs in admin EventForm and EventBuilderEdit, or only the Create page?
3. Which of the 7 "missing" items do you want included now vs. later?
