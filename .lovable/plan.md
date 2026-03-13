

# Allow Sharing Pending Events via Direct Link

## Problem

When a creator shares their event link (e.g., on Facebook), visitors see "Event not available" because RLS blocks `pending` events from non-creators. Admin approval is only needed for listing on Discover — not for direct link access.

## Solution

Add a new RLS policy on the `events` table that allows **anyone** to `SELECT` events with status `pending` — making them viewable via direct link. The Discover page and other listing pages already filter by `approved`/`upcoming`/`ongoing` statuses in their queries, so pending events won't appear there.

Additionally, update the EventView "not available" message to only show for truly unavailable events (rejected/deleted), not pending ones.

## Changes

### 1. New RLS Policy (migration)

```sql
CREATE POLICY "Anyone can view pending events via direct link"
ON public.events
FOR SELECT
TO public
USING (status = 'pending');
```

This is safe because:
- Discover, Events, and search pages query with `.in("status", ["approved", "upcoming", "ongoing"])` — pending events won't appear
- The event data itself is not sensitive (title, date, location, description)
- `payout_phone` is already excluded from public views in EventView

### 2. Update EventView not-found message

Update the `!event` state in `EventView.tsx` to say "Event not found" (since pending events will now load correctly). Remove the "under review" language.

## Files

| File | Change |
|------|--------|
| `supabase/migrations/...` | New RLS policy for pending event visibility |
| `src/pages/EventView.tsx` | Update not-found copy (remove "under review" messaging) |

**2 files. Simple change.**

