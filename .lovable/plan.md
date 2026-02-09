

## Fix Two UI Glitches

Both glitches share the **same root cause**: the auth state listener resets `adminCheckComplete` to `false` every time a `SIGNED_IN` event fires -- which Supabase triggers on tab focus, token refresh, and page navigation. This causes brief "Loading..." flashes and conditional UI elements (like the navbar logo area) to disappear and reappear.

---

### Root Cause

In `src/contexts/AuthContext.tsx` (line 142):

```
if (session?.user) {
  setAdminCheckComplete(false);   // <-- THIS resets on every SIGNED_IN event
  setTimeout(() => {
    fetchProfile(session.user.id);
    checkAdminRole(session.user.id);
  }, 0);
}
```

Every time you switch tabs or navigate, Supabase fires `SIGNED_IN` again. This sets `adminCheckComplete = false`, which:

1. Makes `UserOnlyRoute` show "Loading..." briefly (Glitch 1 -- perceived page refresh)
2. Makes the Navbar re-evaluate conditional renders while admin status is unknown (Glitch 2 -- logo/nav flicker)

---

### Fix

**File: `src/contexts/AuthContext.tsx`**

Only reset `adminCheckComplete` on the very first load, not on subsequent `SIGNED_IN` events for the same user. The fix:

- Track the current user ID
- If the `SIGNED_IN` event is for the **same user** who is already authenticated, skip the admin re-check entirely (the admin role does not change mid-session)
- Only run `fetchProfile` and `checkAdminRole` when the user ID actually changes (new sign-in or different account)

```
// Before (fires on EVERY SIGNED_IN event):
setAdminCheckComplete(false);
setTimeout(() => {
  fetchProfile(session.user.id);
  checkAdminRole(session.user.id);
}, 0);

// After (only fires when user actually changes):
if (session.user.id !== currentUserIdRef.current) {
  currentUserIdRef.current = session.user.id;
  setAdminCheckComplete(false);
  setTimeout(() => {
    fetchProfile(session.user.id);
    checkAdminRole(session.user.id);
  }, 0);
}
```

This uses a `useRef` to track the current user ID without causing re-renders.

---

### What This Fixes

| Glitch | Cause | Result After Fix |
|--------|-------|-----------------|
| Tab switch looks like refresh | `adminCheckComplete` reset triggers "Loading..." flash | No state reset on tab return -- UI stays stable |
| Navbar logo flickers on navigation | Same reset causes conditional navbar elements to unmount/remount | Admin status stays resolved -- no flicker |

### Files Changed

Only one file: `src/contexts/AuthContext.tsx`

- Add `useRef` import
- Add `const currentUserIdRef = useRef<string | null>(null)`
- Wrap the admin check reset in a user-ID-changed guard
- Clear the ref on sign-out

