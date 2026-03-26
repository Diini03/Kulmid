

# Auth Flow Fixes — Google First-Time Detection + Email Signup Reliability

## Root Cause Analysis

### Email Signup Problem
The `signUp` function in `AuthContext.tsx` (line 186-219) calls `supabase.auth.signUp()`. Two issues:

1. **Supabase likely has email confirmation enabled.** When enabled, `signUp()` returns a user object but **no session** — the user is not signed in. The code then shows "Account created successfully" toast and returns `{ error: null }`.
2. **SignUp.tsx line 54-56** navigates to `/onboarding` on success. But `/onboarding` is wrapped in `ProtectedRoute`, which requires an authenticated user. Since there's no session (email not confirmed), `ProtectedRoute` redirects to `/signin`. The user then can't sign in because they haven't confirmed their email.

**Fix:** After `signUp()`, check if a session was returned. If no session (email confirmation required), show a "check your email" message instead of navigating. If session exists (confirmation disabled), proceed to onboarding.

### Google Auth First-Time Detection Problem
Google OAuth works via redirect. After redirect back, `onAuthStateChange` fires with the session. The existing `ProtectedRoute` already checks `hasCompletedOnboarding()` and redirects new users to `/onboarding`. However, Google OAuth redirects to `window.location.origin` (the `/` route), which is the Welcome page wrapped in `PublicRoute` — not `ProtectedRoute`. `PublicRoute` redirects authenticated users to `/events`, which is behind `ProtectedRoute`, which then checks onboarding.

This chain actually works for routing, but the profile creation relies on the `handle_new_user` database trigger (which only sets `full_name` from metadata). There is **no automatic `user_preferences` row creation**, so `hasCompletedOnboarding` returns `false` for new Google users → they get sent to onboarding. This is correct behavior.

**Potential gap:** If the trigger fails or Google doesn't provide `full_name`, the profile row might have issues. We should add a `handlePostAuth` reconciliation step in `AuthContext` to ensure both `profiles` and `user_preferences` rows exist.

## Changes

### 1. `src/contexts/AuthContext.tsx` — Add post-auth reconciliation

Add a `handlePostAuth` function that runs after any successful authentication (both email and Google):
- Upsert profile row (ensures it exists for Google users even if trigger failed)
- Check/create `user_preferences` row if missing (with `onboarding_completed: false`)

Call this from `onAuthStateChange` when a new user session is detected (for Google OAuth callback) and from `signUp` when a session is returned.

**Update `signUp` function** to:
- Check if `data.session` exists after `signUp()`
- If session exists: run `handlePostAuth`, return `{ error: null, needsEmailConfirmation: false }`
- If no session but user exists: return `{ error: null, needsEmailConfirmation: true }`
- Update the return type to include `needsEmailConfirmation`

**Update `onAuthStateChange`** to run `handlePostAuth` on `SIGNED_IN` events for the reconciliation (profile + preferences upsert).

### 2. `src/pages/SignUp.tsx` — Handle email confirmation state

Update `onSubmit` to check the `needsEmailConfirmation` flag:
- If `false`: navigate to `/onboarding` (user is signed in)
- If `true`: show a success state with "Check your email to verify your account" message instead of navigating

Add a local state `emailSent` to toggle the UI to a confirmation message view.

### 3. `src/pages/SignIn.tsx` — Better error context

After failed sign-in, if the error is "Email not confirmed", show a specific helpful message instead of generic "Invalid credentials".

### 4. `src/contexts/AuthContext.tsx` — Update interface

Update `AuthContextType` to change `signUp` return type:
```typescript
signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; needsEmailConfirmation?: boolean }>;
```

## Post-Auth Reconciliation Logic (runs in AuthContext)

```text
handlePostAuth(user):
  1. upsert profiles row (id, user_id, full_name from user metadata)
  2. check if user_preferences row exists
  3. if not → insert with onboarding_completed = false
```

This ensures Google users, email users, and any future OAuth providers all go through the same reconciliation.

## Files Changed

| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add `handlePostAuth`, update `signUp` return type, call reconciliation on auth state change |
| `src/pages/SignUp.tsx` | Handle `needsEmailConfirmation`, show confirmation UI |
| `src/pages/SignIn.tsx` | Improve error message for unconfirmed emails |

**3 files modified. No database changes needed — existing tables and triggers are sufficient.**

## What May Still Need Manual Action

- **Email confirmation setting**: If you want email signup to work without confirmation, disable "Confirm email" in **Supabase Dashboard → Authentication → Providers → Email** settings. The code fix handles both cases gracefully.
- **Google OAuth**: Must remain configured in Supabase Dashboard with correct redirect URLs. No code changes needed for the OAuth flow itself.

