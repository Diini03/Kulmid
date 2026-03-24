

# Discover Page Refinement

## Overview
Reduce hero height and add 4 new event sections (Recommended, Trending, Upcoming Soon, Popular in Your City) below the existing category section, reusing the current EventCard component and design language.

## Changes

### 1. Hero Section — Compact (lines 122-168)
- Change `py-20 md:py-28` → `py-12 md:py-16`
- Change title from `text-5xl md:text-6xl lg:text-7xl` → `text-4xl md:text-5xl lg:text-6xl`
- Keep all content (badge, title, subtitle, CTAs) unchanged

### 2. Data Fetching — Expand `fetchData` to prepare section data
After fetching all events and registration counts, derive additional lists stored in state:

| Section | Logic | State variable |
|---------|-------|----------------|
| **Recommended for you** | If user has preferences, filter events matching `event_categories`/`topics` from `user_preferences`. Fallback: show first 6 from shuffled list. | `recommendedEvents` |
| **Trending now** | Sort by registration count descending, take top 6. | `trendingEvents` |
| **Upcoming soon** | Filter future events, sort by date ascending, take first 6. | `upcomingSoonEvents` |
| **Popular in your city** | If user has `location_city`, filter events whose `location` contains that city. Fallback: skip section or show events from most common location. | `cityEvents` |

All derived client-side from the single existing query — no new API calls except one `user_preferences` fetch (already done for the preference badge).

### 3. Enhance preference check (lines 71-102)
Expand the existing `checkPreferences` effect to also fetch `topics`, `location_city` and store them in state so sections can use them.

### 4. New Event Sections — Add after category section
Each section follows the same pattern:

```text
<section className="border-b">
  <div className="container max-w-5xl px-4 py-12">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button variant="ghost" className="gap-2">View all <ArrowRight /></Button>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sectionEvents.slice(0,6).map(event => <EventCard ... />)}
    </div>
  </div>
</section>
```

Section order:
1. Hero (compact)
2. Browse by category (unchanged)
3. Recommended for you (show only if ≥1 event; hide section entirely if empty)
4. Trending now
5. Featured events (existing, kept as-is)
6. Upcoming soon
7. Popular in your city (show only if location data exists and ≥1 match)

### 5. "View all" behavior
Each section's "View all" button navigates to `/events` with a query param (e.g. `/events?sort=trending`, `/events?sort=upcoming`). Featured keeps existing expand-in-place behavior.

## Files Changed

| File | Action |
|------|--------|
| `src/pages/Discover.tsx` | Reduce hero padding/size, add state for 4 new section lists, derive them in `fetchData`, render new sections |

**1 file modified. No new components. No new API calls beyond existing queries.**

