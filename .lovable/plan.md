
I inspected the current code and the screenshot. The main QR problem is not the domain anymore.

What I found:
- The email templates already generate QR links with `https://www.kulmid.com/check-in/{token}`.
- But the QR image is embedded as a base64 `data:` URL inside the email HTML. Gmail mobile commonly fails to render those inline images, which matches the broken-image placeholder in your screenshot.
- There is also no public `/check-in/:token` route in the app right now, so if someone scans that QR with a normal phone camera, it can still feel “broken” because the URL has nowhere useful to land.
- The support email is still hardcoded as `kulmid@gmail.com` in all 3 transactional email functions.

Plan:
1. Fix QR delivery in emails
- Replace the embedded base64 QR image approach with hosted QR PNGs.
- Generate the QR as an image file server-side and use a normal HTTPS image URL in the email template.
- This is much more reliable across Gmail and other email clients.

2. Make the QR URL actually usable
- Add a public `/check-in/:token` route so scanning the QR opens a real Kulmid page instead of falling into a missing route.
- That page can show a simple branded check-in/pass screen and a clear message if the pass is invalid or expired.

3. Update all support email copy
- Change the support line in the invitation, confirmation, and registration-action emails from `kulmid@gmail.com` to `kulmid2025@gmail.com`.

4. Redeploy and verify
- Redeploy the modified Edge Functions after the changes.
- Send a fresh test email and confirm:
  - the QR image renders in Gmail mobile
  - the QR opens a real `www.kulmid.com` page
  - the support email shows `kulmid2025@gmail.com`

Files I expect to touch:
- `supabase/functions/send-event-invitation/index.ts`
- `supabase/functions/send-registration-confirmation/index.ts`
- `supabase/functions/handle-registration-action/index.ts`
- `src/App.tsx`
- one new public check-in page/component
- possibly a storage migration if I add a dedicated public bucket for hosted QR images

Technical notes:
- I do not think the current issue is the token logic itself; it is mainly email-client rendering.
- The organizer scanner already knows how to extract a token from `/check-in/{token}` format.
- I will keep the existing QR/token verification flow and only make it deliverable and user-visible.
