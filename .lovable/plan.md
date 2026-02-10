
## Redesign Sign-Up: Single-Step Form + Remove Email Confirmation

### What Changes

**1. Remove email confirmation requirement**
- The user needs to go to **Supabase Dashboard > Authentication > Email** and **disable "Confirm email"** (you mentioned you enabled it earlier -- turn it off again)
- Update `AuthContext.tsx` to remove the `confirmationRequired` logic and go back to immediate sign-in after signup

**2. Redesign SignUp.tsx as a single-step form**
Remove the two-step flow (email first, then details). Instead, show all fields at once:

```text
+----------------------------------+
|  Create an account               |
|                                  |
|  [Continue with Google]          |
|  ────────── OR ──────────        |
|                                  |
|  Full Name       [__________]   |
|  Email           [__________]   |
|  Password        [_______ 👁]   |
|  Confirm Password[_______ 👁]   |
|                                  |
|  [x] I agree to Terms & Privacy |
|                                  |
|  [  Create account  ]           |
|                                  |
|  Already have an account? Sign in|
+----------------------------------+
```

**3. Keep domain validation**
- Before submitting, still call the `validate-email-domain` edge function
- If the domain is invalid, show an inline error on the email field

**4. Add confirm password + terms checkbox**
- Add `confirmPassword` field to the Zod schema with a `.refine()` to match password
- Add a required `terms` checkbox -- form cannot submit without it

### Technical Details

**`src/lib/validations.ts`**
- Add `confirmPassword` field to `signUpSchema` using `.refine()` to ensure passwords match
- Add `terms` boolean field with `.literal(true)` validation

**`src/pages/SignUp.tsx`**
- Remove `step` state, `emailForm`, `onEmailContinue`, `handleEditEmail`, and the confirmation screen
- Single form with: fullName, email, password, confirmPassword, terms checkbox
- Call `validate-email-domain` on submit before calling `signUp()`
- On success, navigate to `/onboarding`

**`src/contexts/AuthContext.tsx`**
- Remove `confirmationRequired` from the return type
- Remove the `data.user && !data.session` check
- Return `{ error: null }` on success and navigate immediately

### User Action Required
You must **disable "Confirm email"** in **Supabase Dashboard > Authentication > Email** for this to work (so users are logged in immediately after signup).
