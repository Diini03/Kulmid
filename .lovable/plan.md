

# Kulmid Onboarding + Preference Collection + Recommendation Foundation

## What Already Exists

- **Onboarding page** (`Onboarding.tsx`) with 5 questions (categories, frequency, format, topics, recommendations toggle) — no welcome/completion screen, branded "EventEase"
- **`user_preferences` table** with: `event_categories`, `topics`, `preferred_format`, `attendance_frequency`, `event_mode`, `age_range`, `source`, `allow_recommendations`
- **`hasCompletedOnboarding()`** checks if a row exists in `user_preferences` (fragile — skip creates a row, so it works, but there's no explicit `onboarding_completed` flag)
- **Recommendation engine** in `recommendations.ts` scores by category match, topic match, format match, favorites, registrations, popularity, recency
- **ProtectedRoute** redirects to `/onboarding` if onboarding not completed
- **Discover page** shows personalized badge and links to HomePage for recommendations

## Database Migration

Add 2 columns to `user_preferences`:

```sql
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
```

This gives us an explicit onboarding flag (instead of checking row existence) and a location field for future geo-matching.

## Changes Summary

### 1. `src/constants/onboarding.ts` — Rewrite question config

Replace the current 5-question structure with 6 steps matching the spec:

| Step | Key | Type | Maps to DB column |
|------|-----|------|-------------------|
| 1 | welcome | intro | (none) |
| 2 | interests | multi_select (Technology, Business, Education, Health, Design, Networking, Entertainment, Community, Startup, Workshop) | `topics` |
| 3 | location | text_input with city suggestions | `location_city` (new) |
| 4 | event_types | multi_select (Workshops, Conferences, Meetups, Seminars, Online Events, In-Person Events) | `event_categories` + `event_mode` |
| 5 | attendance_intent | single_select (Often, Sometimes, Rarely) | `attendance_frequency` |
| 6 | finish | completion | (none) |

### 2. `src/pages/Onboarding.tsx` — Rebuild the UI

- Add welcome screen (step 1) with Kulmid branding, illustration, and "Let's personalize your experience" message
- Add completion screen (step 6) with "You're all set" message and auto-redirect
- Add text input step for location (step 3) with common Somalia cities as suggestions
- Keep the existing chip/card selection for multi-select and single-select
- Progress bar across all steps
- "Skip for now" always visible — sets `onboarding_completed = true` with empty preferences
- "Back" button on steps 2+
- "Continue" button disabled only when a required step has no selection (only step 2 "interests" is required)
- Fix branding: "EventEase" → "Kulmid"
- On submit: upsert to `user_preferences` with `onboarding_completed: true`, then navigate to `/discover`

### 3. `src/utils/recommendations.ts` — Enhance scoring

- Update `hasCompletedOnboarding()` to check `onboarding_completed` column instead of row existence
- Add location matching to `calculateRecommendationScore()`: if user's `location_city` matches event's `location` field (case-insensitive contains), add a `LOCATION_MATCH` score boost
- Update `UserPreferences` type to include `location_city`
- Fetch `location_city` alongside other preferences in `getPersonalizedEvents()`

### 4. `src/constants/recommendations.ts` — Add location weight

Add `LOCATION_MATCH: 15` to `SCORING_WEIGHTS`.

### 5. `src/pages/Discover.tsx` — Minor update

The existing preference check and personalized badge logic remains. No major changes needed — it already links to the recommendation engine.

## What This Delivers (MVP)

- One-time, 6-step onboarding (~15 seconds)
- Skip-friendly with proper fallback (trending/recent events)
- Saves interests, location, event types, attendance frequency
- Rule-based recommendation scoring with location boost
- Clean `onboarding_completed` flag for reliable gating
- Data structure ready for future ML: interests, location, event types, frequency, favorites, registrations, check-ins all stored separately

## What This Does NOT Build Yet

- Full ML pipeline (Phase 3 — thesis work)
- Click/view behavior tracking
- Advanced geo-matching or radius-based location
- Admin configuration of onboarding questions (intentionally excluded per spec)

## Files Changed

| File | Action |
|------|--------|
| **Migration** | Add `location_city` and `onboarding_completed` to `user_preferences` |
| `src/constants/onboarding.ts` | Rewrite with 6-step spec |
| `src/pages/Onboarding.tsx` | Rebuild with welcome/completion screens, location input, new question flow |
| `src/utils/recommendations.ts` | Update `hasCompletedOnboarding`, add location scoring |
| `src/constants/recommendations.ts` | Add LOCATION_MATCH weight |

**5 files modified. 1 migration. 0 new files. 0 edge functions.**

