

# Kulmid Platform: Production Readiness Refactor

This is a large-scope review. The plan is organized by impact and grouped into implementable phases.

---

## What Can Be Implemented Directly

### Phase 1: Performance (High Impact)

**1A. Database Indexes**
Add indexes on frequently filtered columns to speed up queries across the platform.

```sql
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_event_guests_event_id ON public.event_guests(event_id);
CREATE INDEX idx_event_guests_status ON public.event_guests(status);
CREATE INDEX idx_event_guests_email ON public.event_guests(email);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
```

**1B. Select Only Needed Columns**
Multiple pages fetch `select('*')` when only a few fields are needed. Fix in:
- `Discover.tsx` — fetch only `id, title, date, location, category, price, image_url, status, description`
- `EventView.tsx` / `EventDetails.tsx` — keep `*` (single record, needs all fields)
- `FavoritesContext.tsx` — select only `id, title, date, location, category, price, image_url`
- `AuthContext.tsx` profile fetch — select only `id, user_id, full_name, avatar_url, created_at, updated_at`
- `recommendations.ts` — multiple `select('*')` calls, narrow to needed columns
- `AdminOverview.tsx` — registration trend makes 7 sequential DB calls (one per day). Replace with a single query using `gte/lte` for the 7-day range and group client-side.

**1C. Eliminate Redundant Queries**
- `Discover.tsx` makes TWO queries to the events table (one for events, one for category counts). Combine into one query and derive counts client-side.
- `AdminOverview.tsx` fetches pending count twice (once in parallel batch, once separately). Remove the duplicate.
- `recommendations.ts` `fetchUserRegistrations` calls `supabase.auth.getUser()` unnecessarily — the user ID is already passed as parameter; pass email from caller instead.

**1D. Lazy Load Heavy Pages**
Currently only `Onboarding` and `Profile` are lazy-loaded. Add lazy loading for:
- All admin pages (AdminOverview, AdminAllEvents, etc.)
- CalendarView, Favorites, Settings, Create, EventBuilder, EventScanner
- HomePage, Help, SystemDocumentation, About, OurTeam, Contact

**1E. QueryClient Configuration**
Add staleTime and cacheTime to prevent unnecessary re-fetches:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**1F. Reduce Realtime Subscription Scope**
`PendingActionsContext.tsx` subscribes to ALL changes on `event_guests` table globally (no filter). This fires on every guest change for every event. Narrow it or remove it and use polling/manual refetch instead.

---

### Phase 2: Security (High Impact)

**2A. File Upload Validation (EventBuilderEdit.tsx)**
Add missing 5MB size limit and MIME type validation to `handleImageChange` — the only upload component without validation.

**2B. SEO Component: Canonical URL Fix**
`Seo.tsx` outputs relative canonical URLs (`/events`). These must be absolute URLs (`https://kulmid.lovable.app/events`).

**2C. OG Image Tags**
Add `og:image`, `og:type`, and `og:url` to the Seo component. For event pages, use the event's cover image.

---

### Phase 3: Reliability & Error Handling (Medium Impact)

**3A. Error States for Data Pages**
Add error handling and error UI to key pages that currently silently fail:
- `Discover.tsx` — no error handling on fetch failure
- `EventView.tsx` — no error state if event not found (just blank)
- `EventDetails.tsx` — has try/catch but no error UI
- `AdminOverview.tsx` — no error handling on any query

Pattern: Add `error` state, display an error card with retry button.

**3B. Disabled States During Submissions**
- `AdminOverview.tsx` approve/reject buttons have no disabled state during processing
- `EventBuilderEdit.tsx` save button should show loading state

**3C. Loading Skeletons**
Replace plain "Loading..." text with proper skeleton components on:
- `AdminOverview.tsx`
- `AdminEventModeration.tsx`
- `Events.tsx` (logged-in loading state)

---

### Phase 4: Code Maintainability (Medium Impact)

**4A. Shared Event Type**
`EventItem` type is defined independently in 5+ files with slight variations. Create a single `src/types/event.ts` and import everywhere.

**4B. Shared Data Hooks**
Create reusable hooks to eliminate duplicated fetch logic:
- `useEvents(filters)` — replaces manual supabase queries in Discover, HomePage, Events
- `useEventById(id)` — replaces duplicate single-event fetches in EventDetails, EventView

**4C. Remove Duplicate Empty State Component**
The "Create your first event" animated empty state appears 3 times in `Events.tsx` (logged out, no events, no filtered events). Extract into a shared component.

---

## What Can Be Partially Improved

**Image Optimization**
- `loading="lazy"` is already on EventCard images — good.
- Cannot add server-side image compression or CDN transforms without external services.
- Recommendation: Use WebP format for future cover images. Current images in `public/covers/` should be manually compressed (outside Lovable scope — user can use tools like Squoosh).

**Bundle Size**
- Recharts is large (~200KB) but only used on admin pages. Lazy loading admin pages (Phase 1D) will code-split this automatically.
- All other dependencies appear reasonable for their purpose.

**Supabase Free Plan Optimizations**
- The `update_event_status` RPC is called on every Discover and HomePage load. This updates ALL events. Consider calling it less frequently (e.g., once per session via a flag, or via a Supabase cron job on Pro plan).
- Narrowing realtime subscriptions (1F) reduces connection overhead.

---

## What Cannot Be Solved Within Current Tooling

| Item | Reason |
|------|--------|
| Server-side image compression/CDN | Requires external service (Cloudinary, imgix) |
| Database-level storage bucket size/MIME restrictions | Must be configured manually in Supabase Dashboard → Storage → event-images → Settings |
| Leaked Password Protection | Requires Supabase Pro plan (user has confirmed not ready) |
| Server-side rendering for SEO | Vite+React SPA cannot do SSR; would require Next.js migration |
| Precomputed analytics/materialized views | Requires Supabase Pro for pg_cron; can partially mitigate with caching |
| AI assistant JWT enforcement | Config change in `supabase/config.toml` is possible but would break public chat widget for non-authenticated users |
| Rate limiting on edge functions | Requires external API gateway or Supabase Pro |

---

## Implementation Summary

| Phase | Items | Files Changed | Estimated Scope |
|-------|-------|--------------|-----------------|
| 1: Performance | Indexes, column selection, dedup queries, lazy loading, QueryClient config, realtime scope | ~15 files + 1 migration | Large |
| 2: Security & SEO | Upload validation, canonical URLs, OG tags | 3 files | Small |
| 3: Reliability | Error states, disabled states, skeletons | ~6 files | Medium |
| 4: Maintainability | Shared types, hooks, extracted components | ~10 files | Medium |

All four phases will be implemented together. The database migration (indexes) will be applied first, followed by all code changes.

