

# Kulmid Action Reliability, Security & UX Refactor

## Overview

After thorough analysis, the issues fall into three categories: **security errors** that must be fixed via database migration, **action reliability** gaps across ~8 components with inconsistent loading/disabled/feedback patterns, and **UX polish** for missing confirmation dialogs and loading states.

---

## Phase 1: Security Fixes (Database Migration)

Three **error-level** security findings require immediate database changes:

### 1A. Remove public access to pending events
The RLS policy `Anyone can view pending events by direct access` exposes all pending event data (including `payout_phone`, `host_email`, `host_phone`) to unauthenticated users. Drop this policy entirely — pending events are already visible to creators via `Users can view their own events` and to admins via `Admins can view all events`.

### 1B. Hide `payout_phone` from public queries
PostgreSQL RLS cannot selectively hide columns, so create a database view `events_public` that excludes `payout_phone`, `host_email`, and `host_phone` for non-owners. Then update frontend public queries (`Discover.tsx`, `EventView.tsx`, `HomePage.tsx`) to use this view.

Alternative simpler approach: since the frontend already guards `host_email`/`host_phone` display, the **critical fix** is the `payout_phone` column. The simplest approach is:
- Drop the pending events public policy (1A above)
- On public event pages (`EventView.tsx`, `Discover.tsx`), never display `payout_phone` — it's only needed in `EventBuilderEdit.tsx` which already requires ownership
- The `payout_phone` remains in the SELECT response but is never rendered publicly. True server-side protection requires a database view or separate table (partial improvement).

### 1C. EventBuilderEdit file validation already fixed
The scan reports missing file validation in `EventBuilderEdit.tsx`, but the current code (lines 87-111) already has 5MB and MIME type validation. This was fixed in the previous refactor. Mark as resolved.

**Migration SQL:**
```sql
-- Drop overly permissive pending events policy
DROP POLICY IF EXISTS "Anyone can view pending events by direct access" ON public.events;
```

---

## Phase 2: Action Reliability (Largest Impact)

Create a reusable `useAsyncAction` hook and apply it across all critical action flows. Currently, each component handles loading/disabled/error differently (or not at all).

### 2A. Create `src/hooks/useAsyncAction.ts`
A reusable hook providing:
- `execute(fn)` — wraps any async function
- `loading` state
- `error` state
- Automatic toast on error
- Prevention of double-execution while loading

### 2B. Fix per-component issues

**RegistrationsTab.tsx** — Most critical:
- Approve/reject buttons have NO loading or disabled state per-row
- Bulk actions process sequentially with no per-item feedback
- Fix: Add `processingIds` set to track which rows are being acted on, disable those rows' buttons, show spinner

**AdminOverview.tsx** — Approve/reject share a single `actionLoading` string:
- Both buttons on a row share the same loading state — clicking approve also disables reject but doesn't indicate which action is running
- Fix: Track `actionLoading` as `{id: string, action: 'approve'|'reject'}` to show correct spinner

**AdminAllEvents.tsx** — `processing` is a single boolean:
- Disables ALL dropdown actions platform-wide when any single action is processing
- Fix: Track processing per-event-id

**AdminEventModeration.tsx** — Same issue:
- `processing` boolean disables ALL cards' buttons when processing any single event

**EventBuilderSettings.tsx** — Delete button:
- Has confirmation dialog but `AlertDialogAction` doesn't show loading state
- Resubmit button has no loading state at all
- Fix: Add `resubmitting` state, show spinner on both actions

**AdminUsers.tsx** — Promote/remove admin:
- No loading, disabled, or confirmation states
- Promoting to admin and removing admin are sensitive actions with no confirmation
- Fix: Add confirmation dialog for both actions, add processing state

**FavoritesContext.tsx** — Add/remove:
- Optimistic UI is good, but errors only `console.error` — no user feedback
- Fix: Add toast on failure

### 2C. Add confirmation dialogs for missing destructive actions

Currently missing:
- **Reject event** in `AdminOverview.tsx` — directly rejects without reason dialog (unlike `AdminAllEvents.tsx` and `AdminEventModeration.tsx` which have it)
- **Promote/remove admin** in `AdminUsers.tsx` — no confirmation
- **Resubmit event** in `EventBuilderSettings.tsx` — no confirmation (status change)

---

## Phase 3: UX Loading & Feedback Consistency

### 3A. Standardize button loading pattern
All async buttons should use: `disabled={loading}` + spinner icon + text change (e.g., "Approving..." instead of "...").

Affected files:
- `AdminOverview.tsx`: Change `"..."` to `"Approving..."` / `"Rejecting..."`
- `AdminEventModeration.tsx`: Same
- `AdminAllEvents.tsx`: Same in dropdown items
- `RegistrationsTab.tsx`: Approve/Reject buttons need spinners

### 3B. Replace "Loading..." text with skeletons
- `AdminAllEvents.tsx` line 153: Plain text loading
- `AdminUsers.tsx` line 71: Plain text loading
- `EventBuilderOverview.tsx` line 282: Plain text loading
- `RegistrationsTab.tsx` line 244-246: Plain text loading

### 3C. Add error states to pages missing them
- `AdminAllEvents.tsx`: No error handling on fetchEvents
- `AdminUsers.tsx`: No error handling on fetchUsers
- `EventBuilder.tsx`: Silently redirects on error instead of showing error

---

## Phase 4: Query Efficiency for Actions

### 4A. Avoid full re-fetch after single-item actions
Currently, approve/reject in `AdminOverview.tsx`, `AdminEventModeration.tsx`, and `AdminAllEvents.tsx` call `fetchData()` / `fetchEvents()` / `fetchPending()` after every action, re-fetching ALL data.

Fix: After successful action, update local state directly (remove from pending list or update status), avoiding a full round trip. Keep the full re-fetch as fallback for error recovery.

### 4B. RegistrationsTab sequential processing
`handleApprove` and `handleReject` process items sequentially (one DB call per guest to fetch details, then update, then email). For bulk actions, `handleBulkAction` calls them one by one.

Fix: Batch the status updates into a single query using `.in('id', ids)`, then send emails in parallel.

---

## What Cannot Be Fully Solved

| Item | Limitation |
|------|-----------|
| `payout_phone` server-side column hiding | RLS cannot filter columns; requires database view or separate table. Frontend fix prevents display but data still in API response. |
| Rate limiting on registration/AI endpoints | Requires Supabase Pro or external API gateway |
| Leaked password protection | Supabase Dashboard setting (Authentication → Settings → Enable Leaked Password Protection) |
| Storage bucket MIME/size server-side enforcement | Must be configured manually in Supabase Dashboard → Storage → event-images → Settings |
| Anonymous registration email verification | Would require email verification flow; current design intentionally allows anonymous registration per business rules |

---

## Implementation Summary

| Phase | Changes | Files |
|-------|---------|-------|
| 1: Security | Drop pending events public policy | 1 migration |
| 2: Action reliability | useAsyncAction hook, per-component fixes, confirmation dialogs | ~8 files + 1 new hook |
| 3: UX consistency | Loading skeletons, button text, error states | ~6 files |
| 4: Query efficiency | Local state updates after actions, batch operations | ~4 files |

**Total: ~15 files modified, 2 new files, 1 migration.**

Priority order: Security (Phase 1) → Action Reliability (Phase 2) → UX (Phase 3) → Query Efficiency (Phase 4).

