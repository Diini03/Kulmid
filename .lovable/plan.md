

## Fix: Navbar logo reloading on every page navigation

### Root Cause
Every page (Events, Discover, Create, etc.) individually wraps itself in `<Layout>`. When you navigate from one page to another, React unmounts the old page's `<Layout>` and mounts the new page's `<Layout>`, causing the Navbar (and its logo image) to briefly disappear and reappear.

### Solution
Move `<Layout>` to `App.tsx` as a shared wrapper around the routes that use it, so it **persists across navigation**. Then remove the `<Layout>` wrapper from each individual page.

### Files to modify

**`src/App.tsx`**
- Import `Layout`
- Wrap groups of routes that need the navbar/footer inside a single `<Layout>` element using a nested `<Route>` with a layout component
- Pages that don't use Layout (e.g., `EventView`, auth pages with `AuthLayout`) remain outside

**15 page files** — remove the `<Layout>` import and wrapper from each:
- `src/pages/Welcome.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/Discover.tsx`
- `src/pages/Events.tsx`
- `src/pages/EventDetails.tsx`
- `src/pages/EventBuilder.tsx`
- `src/pages/Favorites.tsx`
- `src/pages/UserDashboard.tsx`
- `src/pages/CalendarView.tsx`
- `src/pages/Create.tsx`
- `src/pages/Settings.tsx`
- `src/pages/About.tsx`
- `src/pages/OurTeam.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Help.tsx`

### Approach
Create a `LayoutRoute` component in `App.tsx` using React Router's `<Outlet>`:

```tsx
import { Outlet } from "react-router-dom";
const LayoutRoute = () => (
  <Layout>
    <Outlet />
  </Layout>
);
```

Then nest routes under it:
```tsx
<Route element={<LayoutRoute />}>
  <Route path="/discover" element={<Discover />} />
  <Route path="/events" element={<Events />} />
  {/* ... all Layout-using routes */}
</Route>
```

This way `Layout` mounts once and stays mounted -- no more logo flashing.

