## Add Event Capacity (Spots Limit) + Live Progress Bar

`max_attendees` already exists in the `events` table but is not used in the create/edit forms or on the public event details page. We'll surface it end-to-end, Luma-style.

### 1. Create form (`src/pages/Create.tsx`)
Add a "Capacity" section near the date/price fields:
- Two-state toggle: **Unlimited** (default) | **Limited**
- When "Limited" is selected, show a number input (`min=1`) bound to `max_attendees`
- Add `max_attendees: z.number().int().positive().optional().nullable()` to the zod schema
- Persist `max_attendees` in the `eventData` insert payload (null when unlimited)

### 2. Event builder edit (`src/components/events/EventBuilderEdit.tsx`)
Mirror the same Unlimited/Limited toggle + number input so organizers can change capacity after creation. Save via existing update mutation.

### 3. Public event details (`src/pages/EventDetails.tsx`)
- On load, fetch the count of confirmed registrations alongside the event:
  ```ts
  supabase.from('event_guests')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['registered', 'approved'])
  ```
- Render a capacity card just above the Register button **only when `event.max_attendees` is set**:
  - Header row: `Users` icon + `{count} of {max_attendees} spots filled`
  - Right side: `{spotsLeft} spots left` (turns warning color when ≤10% remain, "Sold out" when 0)
  - `<Progress value={(count/max)*100} />` bar (teal primary)
- When sold out: disable the Register button and show "Event is full" badge instead
- When unlimited: show a subtle `Users` line "{count} registered" (no bar) — keeps it simple

### 4. Event card hint (`src/components/events/EventCard.tsx`) — optional polish
If `max_attendees` is set and remaining ≤10, show a small "Only N spots left" badge to drive urgency. Skip if it complicates the card layout.

### Technical notes
- No DB migration needed — column already exists and is nullable.
- Use a single `select` with `count: 'exact'` to avoid an extra round trip; or run in the same `Promise.all` as the existing event/registration fetch.
- RLS already permits public to view `event_guests` count? It does NOT — the SELECT policy on `event_guests` is restricted to admins / event owners. We need a public way to read the count.

### RLS adjustment (migration)
Add a SECURITY DEFINER function that returns just the registered count for a given event id, callable by anon:

```sql
create or replace function public.get_event_registration_count(_event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.event_guests
  where event_id = _event_id
    and status in ('registered','approved');
$$;
grant execute on function public.get_event_registration_count(text) to anon, authenticated;
```

Frontend calls `supabase.rpc('get_event_registration_count', { _event_id: id })` — leaks only the aggregate count, not guest data.

### Files touched
- `src/pages/Create.tsx` (schema + capacity field + insert payload)
- `src/components/events/EventBuilderEdit.tsx` (capacity field + update payload)
- `src/pages/EventDetails.tsx` (fetch count, render progress + sold-out state)
- `src/components/events/EventCard.tsx` (optional "spots left" badge)
- New migration for `get_event_registration_count` RPC
