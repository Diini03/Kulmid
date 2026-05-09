## Goal
Redesign the public event share page (`src/pages/EventView.tsx`) so that the registration CTA, capacity progress, and key event details are immediately visible without scrolling — using a modern two-column layout where the image lives on the left at a balanced size, and the action area sits on the right.

## Problems with current page
1. Image dominates the top of the page (centered, full width), pushing the Register button below the fold.
2. Register button uses default outline style — not visually prominent.
3. Capacity / "spots left" lives below other meta blocks, low visibility.
4. Layout stacks vertically on desktop, wasting horizontal space.
5. No visual hierarchy distinguishing primary action from secondary content.

## New layout (desktop ≥ md)

```text
┌─────────────────────────── Sticky header (Back / Share) ───────────────────────────┐

┌──────────── LEFT (5/12) ────────────┐  ┌────────────── RIGHT (7/12) ──────────────┐
│  Event image                        │  │  Category + type badges                  │
│  rounded-xl, aspect-[4/3]           │  │  H1 Title (3xl–4xl)                      │
│  max-w-sm, sticky top-20            │  │                                          │
│                                     │  │  Compact meta row (date • location •     │
│  Below image (small):               │  │  price) — 3 inline items, icons + label  │
│    Organized by (avatar + name)     │  │                                          │
│                                     │  │  ┌─ Capacity card (highlighted) ───────┐ │
│                                     │  │  │ Users icon  5 of 50 spots filled    │ │
│                                     │  │  │ ████████░░░░░░░  10%   45 left      │ │
│                                     │  │  └─────────────────────────────────────┘ │
│                                     │  │                                          │
│                                     │  │  [ Register for Event ] ← primary teal   │
│                                     │  │     full width, h-12, shadow             │
│                                     │  │                                          │
│                                     │  │  About (heading + description)           │
│                                     │  │  Online Access (if applicable)           │
│                                     │  │  Links · Share · Report                  │
└─────────────────────────────────────┘  └──────────────────────────────────────────┘
```

On mobile (< md): single column — image first (smaller, `aspect-[16/9]`, `max-w-sm`), then title, meta, capacity, and the register button as a **sticky bottom bar** so it's always reachable.

## Specific changes (`src/pages/EventView.tsx` only)

1. **Wrap content in a 12-col grid** on `md:` and up. Left col `md:col-span-5`, right col `md:col-span-7`.
2. **Image**: move into left column. Use `aspect-[4/3]`, `max-w-sm`, `sticky top-20` on desktop. On mobile, render at top with `aspect-[16/9]` and reduced width.
3. **Title + badges**: move into right column, top.
4. **Meta row** (date / location / price): make it a tighter inline row inside the right column instead of the current 3-card grid; keep the same info but smaller footprint so the CTA appears higher.
5. **Capacity block**: 
   - Always render when registrations > 0 or `max_attendees` is set.
   - Stronger visual: light primary tint background (`bg-primary/5 border-primary/20`), bold count, animated progress, "X spots left" pill on the right.
   - Place directly above the Register button so users see urgency next to the CTA.
6. **Register button**: change `variant` to `primary` (existing teal token) and add `size="xl"`, full width, with subtle shadow. Disabled state stays for "Event is Full".
7. **Mobile sticky CTA**: add a `md:hidden fixed bottom-0` bar containing capacity summary + primary Register button so it's always visible while scrolling.
8. **Organized By card**: move under the image in the left column on desktop (compact form); on mobile keep current placement after About.
9. **Spacing**: reduce vertical `space-y-8` to `space-y-6`, tighten meta panel padding, and remove the oversized `aspect-[16/9] max-w-2xl` hero block.
10. **Header Share button**: switch to `variant="primary"` outline style for better visibility; keep sticky header.

## Out of scope
- No changes to data fetching, RPC calls, registration dialog logic, or any backend.
- No changes to other pages (EventDetails for organizers stays the same).
- No new design tokens — reuse existing primary/teal tokens from `index.css`.

## Files to touch
- `src/pages/EventView.tsx` (single file edit)
