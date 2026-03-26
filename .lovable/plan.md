

# Auth Pages Redesign — Modern, Product-Level

## Current Problems
- Right panel is a large empty gradient with animated orbs — purely decorative, wastes half the screen
- Layout uses a 50/50 split that feels like a generic template
- Not aligned with the app's `max-w-5xl` system width
- Missing updated microcopy (subtitles)
- Terms links point to `/help` instead of proper routes

## New Design

### Layout Strategy

**Desktop (lg+):** Single centered container within `max-w-5xl`, two-column grid (60/40 split). Left: form card. Right: meaningful content panel with a product message and a mini event preview card.

**Tablet/Mobile:** Single column, form only, right panel hidden. Centered with comfortable padding.

### File Changes

#### 1. `src/components/layout/AuthLayout.tsx` — Full Rewrite

Replace the current 50/50 split layout:

- Outer container: `min-h-screen bg-background` with a subtle radial glow behind the content area (not a full-panel gradient)
- Inner container: `max-w-5xl mx-auto` with the same system width as the rest of the app
- Header: Logo + theme toggle, same spacing as navbar
- Content area: `grid lg:grid-cols-5` — form gets 3 cols, right panel gets 2 cols
- Form side: Wrapped in a subtle card surface (`bg-card border rounded-xl`) with `max-w-[460px]`, good padding
- Right panel (desktop only): Contains a short product tagline ("Create, discover, and manage events — all in one place"), a mini decorative event card preview showing a sample event with teal accent, and a soft ambient glow tied to brand color
- Footer: Copyright text, centered

Background: Remove the heavy mesh gradient. Use a single very subtle radial glow (`hsl(175 70% 50% / 0.05)`) behind the content area, barely visible but adding depth. Dark mode compatible.

#### 2. `src/pages/SignIn.tsx` — Microcopy + Polish

- Change heading from "Log in" to "Welcome back"
- Add subtitle: "Sign in to manage your events and activity."
- Increase form field spacing from `space-y-4` to `space-y-5`
- Add `variant="default"` (filled) to submit button for strong CTA
- Keep Google button as outlined

#### 3. `src/pages/SignUp.tsx` — Microcopy + Links Fix

- Change heading from "Create an account" to "Create your account"
- Add subtitle: "Start creating and discovering events with Kulmid."
- Increase form field spacing to `space-y-5`
- Change Terms link from `/help` to `/terms` with `target="_blank"`
- Change Privacy link from `/help` to `/privacy` with `target="_blank"`
- Add `variant="default"` to submit button

#### 4. `src/components/auth/SocialLoginButton.tsx` — Minor Polish

- Remove `hover:shadow-md` (keep it subtle per design system)
- Ensure consistent `rounded-lg` with other buttons

### Right Panel Content (Desktop)

```text
┌─────────────────────────┐
│                         │
│  "Create, discover,     │
│   and manage events     │
│   — all in one place."  │
│                         │
│  ┌───────────────────┐  │
│  │  Mini Event Card  │  │
│  │  ┌─────┐          │  │
│  │  │ img │ Title     │  │
│  │  └─────┘ Date      │  │
│  │          Location  │  │
│  └───────────────────┘  │
│                         │
│  Trusted by 1,000+      │
│  event organizers       │
│                         │
└─────────────────────────┘
```

The mini event card is static/decorative — not a real component. Uses the same card styling as EventCard but simplified. Shows a placeholder event like "Kulmid Community Meetup" with a teal accent bar.

### What This Achieves
- Auth pages feel integrated with the main app (same width, same card style)
- Right panel has purpose instead of empty gradient
- Clean, modern SaaS feel without over-design
- Mobile experience is clean single-column
- Consistent with Monochrome Teal design system

### Files Summary

| File | Action |
|------|--------|
| `src/components/layout/AuthLayout.tsx` | Rewrite — new layout with meaningful right panel |
| `src/pages/SignIn.tsx` | Update microcopy, spacing, button variant |
| `src/pages/SignUp.tsx` | Update microcopy, spacing, fix terms links |
| `src/components/auth/SocialLoginButton.tsx` | Minor style cleanup |

**4 files modified. No new files. No dependencies.**

