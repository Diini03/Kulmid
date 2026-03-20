

# Refactor QR Code System: Unique Per-Registration

## Current Problems

1. **Client-side (emailjs.ts)**: Token generated with `Date.now()-random` — weak and NOT saved to DB before sending the email. The QR and DB token are disconnected.
2. **Edge functions** (handle-registration-action, send-registration-confirmation, send-event-invitation): Token uses `guestId-eventId-crypto.randomUUID()` and IS saved to DB — this is the correct pattern but inconsistent with client-side.
3. **QR URL inconsistency**: Client-side generates `/check-in/{eventId}/{token}`, edge functions generate `supabase.co/functions/v1/verify-check-in?token={token}`. Two different formats.
4. **Auto-approve flow** (EventRegistrationDialog): Generates token in emailjs.ts (not saved) AND separately in the dialog (saved) — two different tokens for the same registration.

## What Changes

### 1. Fix token generation in `src/lib/emailjs.ts`

- Make `generateCheckInToken()` accept the guest's `check_in_token` as a parameter instead of generating its own
- Update `generateQRCodeUrl()` to use the standard check-in URL format: `https://kulmid.lovable.app/check-in/{token}`
- Both `sendRegistrationEmail` and `sendEventInvitation` will receive the already-saved token and pass it to the QR generator

### 2. Fix `src/components/events/EventRegistrationDialog.tsx`

- Generate token using `crypto.randomUUID()` (browser API, cryptographically secure)
- Save token to DB first, then pass it to the email function
- Ensure the same token is used in both DB and email QR

### 3. Fix `src/components/events/RegistrationsTab.tsx`

- Update token generation to use `crypto.randomUUID()`
- Pass the saved token to the email function

### 4. Standardize QR URL format across edge functions

Update `handle-registration-action/index.ts`, `send-registration-confirmation/index.ts`, and `send-event-invitation/index.ts`:
- QR URL becomes `https://kulmid.lovable.app/check-in/{token}` (user-facing URL, not raw Supabase function URL)
- Token generation uses `crypto.randomUUID()` (already cryptographically secure in Deno)

### 5. No database changes needed

The `event_guests` table already has:
- `id` (registration ID)
- `event_id`
- `name`, `email`
- `status`
- `check_in_token`
- `checked_in`, `checked_in_at`

All required fields exist.

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/emailjs.ts` | Token passed in, not generated; QR URL uses `/check-in/{token}` |
| `src/components/events/EventRegistrationDialog.tsx` | Use `crypto.randomUUID()`, save to DB before email, pass token to email fn |
| `src/components/events/RegistrationsTab.tsx` | Use `crypto.randomUUID()`, pass saved token to email fn |
| `supabase/functions/handle-registration-action/index.ts` | QR URL → `kulmid.lovable.app/check-in/{token}`, use `crypto.randomUUID()` |
| `supabase/functions/send-registration-confirmation/index.ts` | Same QR URL change |
| `supabase/functions/send-event-invitation/index.ts` | Same QR URL change |

**No database migration needed. 6 files changed. 0 new files.**

## Result

- Every registration gets one cryptographically random token
- Token is saved to DB before QR is generated
- QR encodes `https://kulmid.lovable.app/check-in/{token}` — unique per guest
- Public event sharing QR (event page URL) remains separate and unchanged
- System is ready for a check-in verification page at `/check-in/:token`

