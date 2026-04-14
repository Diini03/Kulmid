

## Plan: Redesign Email Templates (Light Mode, Mobile-Compact, Fix QR Bug)

### Problems
1. **Dark mode emails** — Not industry standard. Stripe, Eventbrite, Google all use light backgrounds. Dark emails can look inconsistent across clients and feel less trustworthy.
2. **Long scroll on mobile** — Too much vertical padding and spacing.
3. **QR bug** — `send-registration-confirmation` has a variable shadowing bug (`const qrImageUrl` inside the `if` block shadows the outer `let qrImageUrl`), so the QR URL is always empty in confirmation emails.

### Design Direction
Switch all 4 email templates to a **clean light-mode design**:
- Background: `#f4f4f5` (light gray)
- Card: `#ffffff` (white) with subtle border
- Text: `#111827` (near-black)
- Accent: Kulmid teal `#14b8a6`
- Status badges: green for confirmed, amber for pending, red for rejected
- Tighter padding (16-20px instead of 28-32px) for mobile compactness
- Smaller heading sizes (24px instead of 30px)
- QR pass section stays visually distinct but lighter

### Files to Change (4 Edge Functions)

1. **`supabase/functions/send-registration-confirmation/index.ts`**
   - Fix QR bug: remove the inner `const` so the outer `qrImageUrl` variable gets assigned
   - Replace dark HTML template with light-mode design

2. **`supabase/functions/send-event-invitation/index.ts`**
   - Replace dark HTML template with light-mode design

3. **`supabase/functions/handle-registration-action/index.ts`**
   - Replace both approval and rejection dark templates with light-mode design

4. **`supabase/functions/send-registration-notification/index.ts`**
   - Replace organizer notification dark template with light-mode design (if it has one)

### After Changes
- Redeploy all 4 Edge Functions
- The emails will render cleanly on Gmail mobile, be shorter to scroll, and feel more professional

