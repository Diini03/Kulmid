

## Stripe Connect Popup on Paid Toggle

When the user clicks the "Paid" button on the Create Event page, instead of showing price/payout fields, show a dialog prompting them to connect their Stripe account -- similar to how Luma does it, styled to match the existing `AuthRequiredModal` pattern.

### What to build

**New component: `src/components/events/StripeConnectDialog.tsx`**
- Dialog using existing `Dialog`/`DialogContent` from the UI library
- Matches `AuthRequiredModal` layout: icon in rounded container, bold title, description text, single CTA button
- Icon: `DollarSign` or `CreditCard` from lucide-react
- Title: "Accept Payments"
- Description: "This calendar is not yet set up to accept payments. We use Stripe to process payments. Connect or set up a Stripe account to start accepting payments. It usually takes less than 5 minutes."
- "Stripe" text in description styled with `text-primary` (teal accent)
- Button: "Connect Stripe" -- opens `https://connect.stripe.com` in a new tab
- Close button via dialog's built-in X

**Modify `src/pages/Create.tsx`**
- Import the new dialog
- Add `stripeDialogOpen` state
- When "Paid" button is clicked: instead of `setIsPaid(true)`, open the Stripe dialog
- Keep `isPaid` as `false` (user can't set paid pricing until Stripe is connected -- for now just show the dialog)
- The price/payout fields remain hidden since `isPaid` stays false

**Modify `src/components/events/EventBuilderEdit.tsx`** and **`src/components/admin/EventForm.tsx`**
- Same pattern: clicking "Paid" opens the Stripe connect dialog instead of showing price fields

### Files
- **Create**: `src/components/events/StripeConnectDialog.tsx`
- **Modify**: `src/pages/Create.tsx`, `src/components/events/EventBuilderEdit.tsx`, `src/components/admin/EventForm.tsx`

