

## Enable Google Sign-In

You've completed all the external setup -- now I just need to wire up the frontend code. Here's what will change:

### What will be updated

**3 files** need their placeholder "coming soon" handlers replaced with actual Google OAuth calls:

1. **`src/pages/SignIn.tsx`** -- Replace the `handleGoogleSignIn` function with a real `supabase.auth.signInWithOAuth({ provider: 'google' })` call, using `window.location.origin` as the redirect URL so it works on both `kulmid.com` and the Lovable preview.

2. **`src/pages/SignUp.tsx`** -- Same change for `handleGoogleSignUp`. Google OAuth uses the same method for both sign-in and sign-up (Supabase auto-creates the account if it doesn't exist).

3. **`src/components/auth/AuthRequiredModal.tsx`** -- Same change for the Google button in the auth-required modal popup.

### How it works

- Clicking "Continue with Google" will redirect the user to Google's consent screen
- After approval, Google redirects back to your Supabase callback URL (`txjglujklpxsfhedwwkl.supabase.co/auth/v1/callback`)
- Supabase then redirects the user back to `kulmid.com` (your configured Site URL)
- The existing `AuthContext` listener picks up the new session automatically

### Important: Verify your Supabase URL config

Make sure in your **Supabase Dashboard > Authentication > URL Configuration**:
- **Site URL** is set to `https://www.kulmid.com` (or `https://kulmid.com`)
- **Redirect URLs** includes `https://www.kulmid.com/**` and `https://kulmid.com/**`

This ensures users land back on your site after Google login.

