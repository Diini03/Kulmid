

## Plan: Update QR Code URLs to Use Custom Domain

### Problem
QR codes in emails point to `https://kulmid.lovable.app/check-in/{token}` instead of your actual custom domain `https://www.kulmid.com/check-in/{token}`.

### Changes

**1. `supabase/functions/send-event-invitation/index.ts`**
- Change `https://kulmid.lovable.app/check-in/` → `https://www.kulmid.com/check-in/`

**2. `supabase/functions/send-registration-confirmation/index.ts`**
- Same URL update

**3. `supabase/functions/handle-registration-action/index.ts`**
- Same URL update

**4. `src/components/Seo.tsx`**
- Update `BASE_URL` from `https://kulmid.lovable.app` → `https://www.kulmid.com`

All 4 files — just a find-and-replace of the domain. The `verify-check-in` Edge Function doesn't care about the domain — it only validates the token from the request body, so no change needed there.

