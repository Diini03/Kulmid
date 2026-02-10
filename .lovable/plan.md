
## Update Sign-Up Flow for Email Confirmation

Since you've enabled "Confirm email" in Supabase, users now receive a verification email before they can log in. We need to update the code so it doesn't try to navigate to onboarding immediately — instead, it shows a "Check your inbox" message.

### Changes

**1. `src/contexts/AuthContext.tsx` — Update `signUp` function**
- Detect when Supabase returns a user but no active session (meaning confirmation is pending)
- Change the success toast to say "Check your inbox to verify your email"
- Return a flag like `{ error: null, confirmationRequired: true }` so the SignUp page knows what to do

**2. `src/pages/SignUp.tsx` — Show "Check your inbox" screen**
- After successful sign-up, instead of navigating to `/onboarding`, show a confirmation screen with:
  - A mail icon
  - "Check your inbox" heading
  - Message saying "We sent a verification link to [email]. Click the link to activate your account."
  - A "Back to Sign In" button
- No auto-navigation, user must verify first

**3. `src/pages/SignUp.tsx` — Fix password hint text**
- Line 216 still says "Must be at least 8 characters" but we changed the rule to 6. Update to "Must be at least 6 characters with one letter and one number"

### Technical Details

- `signUp` return type changes from `{ error: any }` to `{ error: any; confirmationRequired?: boolean }`
- Detection logic: when `data.user` exists but `data.session` is `null`, confirmation is required
- The confirmation screen is a new `step` state value (`'email' | 'details' | 'confirmation'`) in SignUp.tsx
- No database or edge function changes needed — this is purely frontend
