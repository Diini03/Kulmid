

## Three Changes

### 1. Remove `/dashboard` page
- **`src/App.tsx`**: Remove the `/dashboard` route (line 112), remove `UserDashboard` import (line 32)
- **`src/components/layout/Navbar.tsx`**: Remove "Dashboard" link from desktop dropdown (lines 206-211) and mobile menu (lines 344-357)
- Optionally delete `src/pages/UserDashboard.tsx` and dashboard components if no longer referenced

### 2. Fix avatar not showing in navbar after save
The issue: `AuthContext` Profile interface only has `id, user_id, full_name, created_at, updated_at` — no `avatar_url`. Even if the DB saves it, the navbar Avatar component only reads `profile?.full_name` for the fallback letter and never checks `avatar_url`.

Fix:
- **`src/contexts/AuthContext.tsx`**: Add `avatar_url?: string` to the `Profile` interface
- **`src/components/layout/Navbar.tsx`**: Import `AvatarImage` alongside `AvatarFallback`, and render `<AvatarImage src={profile?.avatar_url} />` inside the Avatar so the uploaded photo appears
- **`src/components/settings/ProfileSettings.tsx`**: After successful save, refresh the auth profile so the navbar picks up the new avatar immediately (call a profile refetch or update context)

### 3. Replace theme dropdown with simple toggle button
- **`src/components/layout/Navbar.tsx`**: Replace the `DropdownMenu` theme toggle (lines 146-175) with a single `Button` that toggles between light and dark mode. Click = switch. Show `Sun` icon in dark mode, `Moon` icon in light mode. Remove `Monitor`, `Check` imports if unused elsewhere.
- Mobile menu theme section (lines 416-445): simplify to a single toggle button as well.

### Files modified
- `src/App.tsx`
- `src/components/layout/Navbar.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/settings/ProfileSettings.tsx`
- `src/pages/UserDashboard.tsx` (delete)

