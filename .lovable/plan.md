

## Plan: Remove EmailJS and Wire Client Code to Resend Edge Functions

### Summary

The Edge Functions already use Resend. Now we remove all client-side EmailJS code and rewire the 3 components to call the existing Edge Functions instead.

### Changes

**1. Delete `src/lib/emailjs.ts`**
- Remove the entire file — no longer needed.

**2. Remove `@emailjs/browser` dependency from `package.json`**

**3. Update `src/components/events/InviteGuestsDialog.tsx`**
- Remove import of `sendEventInvitation`, `isEmailJSConfigured` from emailjs
- Remove the `isEmailJSConfigured()` check block
- Replace the EmailJS `sendEventInvitation()` call with `supabase.functions.invoke('send-event-invitation', { body: { eventId, emails, customTitle, customMessage } })`
- The Edge Function already handles fetching event details, sending emails, and storing invitation records — so we simplify the client code significantly

**4. Update `src/components/events/EventRegistrationDialog.tsx`**
- Remove import of `sendRegistrationEmail`, `sendOrganizerNotification`, `isEmailJSConfigured` from emailjs
- Replace the EmailJS block with `supabase.functions.invoke('send-registration-confirmation', { body: { guestId: registrationId, eventId } })`
- The Edge Function already handles confirmation emails and organizer notifications

**5. Update `src/components/events/RegistrationsTab.tsx`**
- Remove import of `sendRegistrationEmail`, `isEmailJSConfigured` from emailjs
- Replace approve/reject EmailJS calls with `supabase.functions.invoke('handle-registration-action', { body: { guestId: id, action: 'approve'/'reject' } })`
- The Edge Function already handles status updates and email sending

### What stays the same
- All Edge Functions (already migrated to Resend)
- All HTML email templates
- QR code generation (handled server-side in Edge Functions)
- Database logic

### Technical note
The `generateCheckInToken` and `generateQRCodeUrl` utility functions in `emailjs.ts` are already duplicated in the Edge Functions, so deleting the file loses nothing.

