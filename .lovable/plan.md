

# Global Badge, Counter & Unread Indicator System

## Current State

Already working:
- **Notification bell** — unread count badge with real-time updates via `NotificationsContext`
- **Organizer pending registrations** — badge on avatar + "My Events" menu item via `PendingActionsContext`
- **Admin Event Moderation** — pending events count badge in sidebar (local fetch in `AdminLayout`)

Missing:
- Admin sidebar badges for **Reports** (open count) and **Registrations** (pending count)
- Real-time updates for admin sidebar badges (currently only refetches on route change)
- No centralized admin badge system — pending count is fetched inline in `AdminLayout`

## Plan

### 1. Create `AdminBadgesContext` — new file

A single context that fetches and exposes all admin badge counts with real-time subscriptions.

Counts tracked:
- `pendingEventsCount` — events with status `pending` (for Event Moderation badge)
- `openReportsCount` — reports with status `open` or `reviewing` (for Reports badge)  
- `pendingRegistrationsCount` — event_guests with status `pending` (for Registrations badge)

Real-time: Subscribe to `events`, `reports`, and `event_guests` tables for changes. Refetch relevant count on change.

Uses lightweight `count` queries (`select('*', { count: 'exact', head: true })`).

Only activates for admin users (check `isAdmin` from AuthContext).

### 2. Update `AdminLayout` — add badges to sidebar

- Remove the inline `pendingCount` fetch logic
- Import `useAdminBadges()` from the new context
- Add `badge: 'pendingEvents'` / `'openReports'` / `'pendingRegistrations'` keys to `menuItems`
- Render badges on Event Moderation, Reports, and Registrations sidebar items
- Hide badge when count is 0

### 3. Update `App.tsx` — wrap admin routes with provider

Add `AdminBadgesProvider` inside the provider tree (inside `AuthProvider`).

### 4. Notification bell — already complete

The existing `NotificationsContext` with real-time subscription handles this fully. No changes needed.

### 5. Organizer pending actions — already complete

`PendingActionsContext` with real-time subscription handles this. No changes needed.

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/AdminBadgesContext.tsx` | **New** — centralized admin badge counts with real-time |
| `src/components/admin/AdminLayout.tsx` | Use context instead of inline fetch, add Reports + Registrations badges |
| `src/App.tsx` | Add `AdminBadgesProvider` to provider tree |

**3 files total. No migrations needed.**

