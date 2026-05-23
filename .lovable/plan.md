## Security & Performance Hardening Plan

The security scan flagged **5 critical/high issues** plus several warnings. Here is the fix plan — grouped by severity.

---

### 🔴 CRITICAL — Data Exposure (fix immediately)

**1. Public `events` table leaks host PII**
The "Public can view approved events" policy lets anyone (even logged-out scrapers) read `host_email`, `host_phone`, and `payout_phone` of every event.
- Create a SECURITY INVOKER view `public.events_public` that excludes `host_email`, `host_phone`, `payout_phone`, `host_description` (and any internal fields).
- Update the public "Anyone can view pending events" + "Public can view approved events" policies to scope sensitive columns. Easiest: drop public SELECT on `events` and switch all public-facing reads (`Discover`, `EventView`, `EventCard`, `useEvents`, `HomePage`) to query `events_public`.
- Owners + admins keep full access to `events` (already covered by existing policies).

**2. "Anyone can view pending events" leaks every pending event**
Policy `(status = 'pending')` exposes ALL pending events. Drop this policy and instead allow public read of pending events only through the sanitized view (no PII), or require the requester to be the creator / hold a share token.

**3. Realtime notifications can be subscribed to by any user**
`notifications` is on Realtime with no `realtime.messages` RLS. Anyone authenticated can listen to another user's channel.
- Add RLS on `realtime.messages` restricting subscription topics to `user:{auth.uid()}` pattern, OR remove `notifications` from the realtime publication and poll via REST.

---

### 🟠 HIGH — Insert / Write Abuse

**4. `event_registration_answers` accepts inserts from anyone for any registration_id**
WITH CHECK is `true`. An attacker can pollute any registration's answers.
- Tighten the INSERT policy to require the `registration_id` to belong to a guest row created in the same request (match by recent timestamp + email), or move answer insertion into the same atomic RPC as the registration insert (SECURITY DEFINER function that creates guest + answers in one transaction).

**5. `event_guests` `check_in_token` stored in plaintext + over-broad owner read**
- Hash `check_in_token` at rest (store `check_in_token_hash`); the QR code still carries the plaintext token, but DB leaks become safer.
- Add a SELECT policy so a guest can read their own row by email + token combination (needed for the public confirmation page).

---

### 🟡 WARN — Hardening

**6. 19× "SECURITY DEFINER function callable by public/auth"**
All our trigger / helper functions are exposed via PostgREST. Revoke EXECUTE from `anon` and `authenticated` on every `public.*` function that isn't meant to be RPC-called: `update_event_status`, `generate_username_slug`, `assign_username_on_profile_insert`, all `notify_*` / `send_*` trigger functions, `validate_admin_email`, `initialize_event_registration_fields`, `update_updated_at_column`, `handle_new_user`.
Keep EXECUTE only on `has_role` and `get_event_registration_count` (these are read-only and used by RLS / RPC).

**7. Public storage buckets allow listing**
`event-images` and `avatars` are public but their SELECT policy allows `LIST`. Replace the bucket SELECT policy with one that allows `SELECT` on individual objects only — clients can still fetch by URL, but cannot enumerate the bucket.

**8. Leaked password protection disabled**
Enable Supabase Auth → "Leaked password protection" (Have-I-Been-Pwned check) in the dashboard. I'll add a one-line note in the migration description pointing the user to the dashboard toggle (it can't be set via SQL).

---

### 🔵 Code-side hardening (non-DB)

**9. Edge functions with `verify_jwt = false`**
`send-event-invitation`, `send-registration-confirmation`, `ai-assistant`, `validate-email-domain`, `verify-check-in`, `handle-registration-action`, `generate-description`, `predict-attendance` — review each:
- Add per-IP rate-limiting (in-memory LRU keyed by `x-forwarded-for`, 20 req/min).
- Validate all inputs with Zod (max length, email format, allowed enum values) — prevents prompt injection on `ai-assistant` & `generate-description`.
- `send-event-invitation` / `send-registration-confirmation`: verify the caller actually owns the event (lookup by `event_id` + creator), don't trust the email field blindly — prevents using the platform as a spam relay.

**10. Frontend XSS / input validation pass**
- Audit any `dangerouslySetInnerHTML` (search & remove or wrap in DOMPurify).
- Add Zod schemas everywhere user input touches Supabase (`EventForm`, `EventRegistrationDialog`, `ProfileSettings`, `AdminCategories`, `Create`).
- Make sure `encodeURIComponent` is used on all URL params in calendar / share links.

**11. Add security headers**
Add a `vercel.json` headers block: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a starter CSP (allow self + supabase domain + Stripe + Google Fonts).

---

### ⚡ Performance pass (bundled with security work)

- Convert remaining hardcoded `categories` consumers (already partially done) to use the cached `useCategories` hook → fewer re-renders.
- Wrap heavy admin routes (`AdminAnalytics`, `AdminReports`, `AdminCategories`, `EventBuilder*`) in `React.lazy()` — they're never loaded by public users.
- Add `staleTime: 60_000` to all React Query reads of events/categories.
- Add explicit `width`/`height` (or `aspect-ratio`) on every `<img>` to kill CLS.
- `loading="lazy"` + `decoding="async"` on non-hero images.
- `fetchpriority="high"` on the EventView hero image.

---

### Migration / file plan

**Migrations (one file):**
- Create `events_public` view + grants
- Drop overly-broad public SELECT policies on `events`
- Tighten `event_registration_answers` INSERT
- Hash `check_in_token`
- REVOKE EXECUTE on internal SECURITY DEFINER functions
- Tighten storage object SELECT policies on `event-images` & `avatars`
- (Optional) realtime.messages policy for notifications

**Code edits:**
- `useEvents.ts`, `Discover.tsx`, `EventView.tsx`, `EventCard.tsx`, `EventDetails.tsx`, `HomePage.tsx` → switch reads to `events_public`
- `EventRegistrationDialog.tsx` + new `register-for-event` edge function (atomic insert)
- All edge functions: add Zod + rate-limit helper (`supabase/functions/_shared/rateLimit.ts`)
- `vercel.json` → security headers
- `App.tsx` → `React.lazy` admin chunks
- `src/lib/validations.ts` → expand schemas

**Manual (user must click):**
- Enable "Leaked password protection" in Supabase Auth dashboard
- Review the Realtime publication list and drop `notifications` if you want the simpler fix

---

### What I'd like to confirm before building

1. For the public `events` view: OK to **strip `host_email`, `host_phone`, `payout_phone`, `host_description`** from public reads? (Owners still see them in their dashboard.)
2. For notifications realtime: prefer **(a) add restrictive RLS on `realtime.messages`** or **(b) remove notifications from realtime and use polling** (simpler, slightly less instant)?
3. Do you want me to do everything above in one pass, or split it into "critical only" first and the hardening/performance in a follow-up?
