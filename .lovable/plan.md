

# Fix: RLS violation on event registration

## Root Cause

The insert at line 58 of `EventRegistrationDialog.tsx` uses `.insert({...}).select("id").single()`. In Supabase, `.select()` after `.insert()` requires **SELECT permission** on the inserted row. The RLS policies on `event_guests` only grant SELECT to the event owner and admins — not to the public user who is registering.

Additionally, the duplicate-check SELECT query (line 40-45) silently returns empty for non-owners due to RLS, so it doesn't actually detect duplicates (the unique constraint fallback on line 70 handles that, but it's fragile).

## Fix Strategy

**Generate the registration UUID client-side** and pass it in the insert payload. This eliminates the need for `.select("id").single()` after insert, so no SELECT permission is required.

### Changes in `EventRegistrationDialog.tsx`:

1. Generate `const registrationId = crypto.randomUUID()` before the insert
2. Include `id: registrationId` in the insert payload
3. Change `.insert({...}).select("id").single()` to just `.insert({...})`
4. Use `registrationId` directly for the custom answers insert and the check-in token update
5. Remove the duplicate-check SELECT query (lines 40-45) — rely on the unique constraint error (code `23505`) which already works and is already handled

### Code change (single file):

```typescript
// Before
const { data: existing } = await supabase
  .from("event_guests")
  .select("id, status")
  .eq("event_id", eventId)
  .eq("email", email)
  .maybeSingle();

if (existing) { ... }

const { data: registration, error } = await supabase.from("event_guests").insert({
  event_id: eventId,
  ...
}).select("id").single();

// After
const registrationId = crypto.randomUUID();

const { error } = await supabase.from("event_guests").insert({
  id: registrationId,
  event_id: eventId,
  ...
});

// Then use registrationId directly for answers and token update
```

## Why this is the correct fix

- No new RLS policies needed (adding public SELECT to event_guests would expose guest data)
- No schema changes needed
- The INSERT policy already allows public inserts with `registration_type = 'registration'`
- Duplicate registrations are caught by the `23505` unique constraint error which is already handled
- Client-generated UUIDs are standard practice with Supabase

## Files to change

| File | Change |
|------|--------|
| `src/components/events/EventRegistrationDialog.tsx` | Generate client-side UUID, remove `.select()` chain, remove pre-check SELECT query |

**1 file modified. 0 migrations. 0 new files.**

