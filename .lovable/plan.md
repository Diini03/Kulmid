

## Refactor: Full User/Admin Interface Separation

### Current State
- Admin routes use `<ProtectedRoute>` (checks auth only, not admin role)
- Each admin page internally checks `isAdmin` and renders `<Navigate>` if not admin
- `UserOnlyRoute` redirects admins away from user pages to `/admin`
- `PublicRoute` redirects admins to `/admin` on login
- Mixed routing structure in `App.tsx` with no dedicated admin route guard

### What Changes

#### 1. Create `AdminRoute` guard component
New file: `src/components/auth/AdminRoute.tsx`
- Checks `isAdmin` from AuthContext
- If not admin, redirects to `/events`
- If not authenticated, redirects to `/signin`
- Shows loading state during auth/role check
- Wraps all `/admin/*` routes, removing per-page admin checks

#### 2. Update `ProtectedRoute` to block admins from user pages
Modify `src/components/auth/ProtectedRoute.tsx`:
- After auth check, also check `isAdmin` + `adminCheckComplete`
- If admin, redirect to `/admin`
- This replaces the separate `UserOnlyRoute` wrapper

#### 3. Simplify `App.tsx` routing
- Remove `UserOnlyRoute` component (merged into `ProtectedRoute`)
- Wrap all `/admin/*` routes with `AdminRoute`
- Use a nested route with `AdminLayout` as the layout route for all admin pages
- Clean structure:

```text
/ (public)
/signin, /signup (PublicRoute)
/events, /home, /favorites, ... (ProtectedRoute → user only)
/admin/* (AdminRoute → AdminLayout → admin pages)
```

#### 4. Update `PublicRoute` redirect logic
Modify `src/components/auth/PublicRoute.tsx`:
- Already redirects admins to `/admin` -- keep this behavior
- Ensure consistent redirect for users to `/events`

#### 5. Clean up `AuthContext`
Modify `src/contexts/AuthContext.tsx`:
- Remove the unused `adminSignIn` function (lines 263-336) -- it's insecure and never exposed in the context type
- Keep `checkAdminRole`, `isAdmin`, `adminCheckComplete` as-is

#### 6. Remove per-page admin checks from admin pages
Update all admin page files to remove their internal `isAdmin` check + `<Navigate>`:
- `AdminOverview.tsx`
- `AdminEventModeration.tsx`
- `AdminAllEvents.tsx`
- `AdminUsers.tsx`
- `AdminRegistrations.tsx`
- `AdminCategories.tsx`
- `AdminAnalytics.tsx`
- `AdminReports.tsx`
- `AdminPlatformSettings.tsx`
- `AdminSettingsPage.tsx`

Each page will simply render its content wrapped in `<AdminLayout>`, since `AdminRoute` handles access control.

#### 7. Admin layout route pattern
Create an `AdminLayoutRoute` in `App.tsx` (similar to `LayoutRoute`):
```tsx
const AdminLayoutRoute = () => (
  <AdminRoute>
    <AdminLayout><Outlet /></AdminLayout>
  </AdminRoute>
);
```
All admin routes become children of this, removing `<AdminLayout>` wrapper from each individual page.

### Files Changed
| File | Action |
|------|--------|
| `src/components/auth/AdminRoute.tsx` | **Create** -- admin route guard |
| `src/components/auth/ProtectedRoute.tsx` | **Modify** -- add admin redirect |
| `src/contexts/AuthContext.tsx` | **Modify** -- remove dead `adminSignIn` |
| `src/App.tsx` | **Modify** -- restructure routes with AdminRoute + AdminLayoutRoute |
| 10 admin page files | **Modify** -- remove internal admin checks and AdminLayout wrappers |

### No Database Changes Required
Role checking already works correctly via `user_roles` table and `has_role()` function.

