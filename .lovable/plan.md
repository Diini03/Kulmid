

## Plan: Switch Email Sending from Mailjet to Resend

### What changes

All 3 Edge Functions currently use `sendEmailWithMailjet()` with Mailjet API. We'll replace that helper with `sendEmailWithResend()` using the Resend API directly — keeping the same beautiful HTML templates untouched.

### Files modified

**1. `supabase/functions/send-event-invitation/index.ts`**
- Replace `sendEmailWithMailjet` function with `sendEmailWithResend`
- Uses `RESEND_API_KEY` from Supabase secrets
- From address: `Kulmid Events <noreply@kulmid.com>`
- Resend API endpoint: `https://api.resend.com/emails`
- Keep all existing HTML templates, QR code generation, auth, and guest logic unchanged

**2. `supabase/functions/send-registration-confirmation/index.ts`**
- Same swap: Mailjet helper replaced with Resend helper
- From address: `Kulmid Events <noreply@kulmid.com>`
- Keep all existing HTML templates and business logic unchanged

**3. `supabase/functions/send-registration-notification/index.ts`**
- Same swap: Mailjet helper replaced with Resend helper
- From address: `Kulmid Events <noreply@kulmid.com>`
- Keep all existing HTML templates and business logic unchanged

### What stays the same

- **EmailJS client-side code** (`src/lib/emailjs.ts`) — untouched as you requested
- All HTML email templates (dark theme, teal accents, QR codes)
- All authentication, authorization, and database logic
- All other Edge Functions (ai-assistant, verify-check-in, etc.)

### Technical details

The Resend send helper is simple:
```
POST https://api.resend.com/emails
Authorization: Bearer RESEND_API_KEY
Body: { from, to, subject, html }
```

No connector gateway needed since this is a direct API call from Edge Functions using the `RESEND_API_KEY` secret you already configured.

After updating the code, all 3 functions will be redeployed automatically.

