

## Complete Admin Dashboard Redesign for Kulmid

This is a large system redesign covering 10 admin pages. I'll implement it in **two phases** to keep changes clean and error-free.

### Phase 1 (This Implementation)
Core pages that provide immediate value: Overview, Event Moderation, All Events, Users, Registrations, Analytics — plus the new sidebar and admin email migration.

### Phase 2 (Follow-up)
Categories, Reports, Platform Settings, Admin Settings pages.

---

### Database Migration

1. **Update `validate_admin_email`** function to use `admin@kulmid.com` instead of `diini@gmail.com`
2. **Create `platform_settings` table** for toggle-based platform configuration (used by Platform Settings page in Phase 2, but schema set up now)
3. **Create `reports` table** for flagged content (Phase 2 UI, schema now)

```sql
-- Fix admin email validation
CREATE OR REPLACE FUNCTION public.validate_admin_email() ...
  IF NEW.role = 'admin' AND user_email != 'admin@kulmid.com' THEN ...

-- Platform settings (key-value store)
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
-- RLS: admin-only

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'event', 'user', 'spam'
  target_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  reported_by uuid REFERENCES auth.users(id),
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
-- RLS: admin-only
```

---

### New AdminLayout with Full Sidebar

**File**: `src/components/admin/AdminLayout.tsx` — Complete rewrite

Sidebar with 10 items, each with icon:
- Overview → `LayoutDashboard`
- Event Moderation → `ShieldCheck`
- All Events → `Calendar`
- Users → `Users`
- Registrations → `ClipboardList`
- Categories → `Tag`
- Analytics → `BarChart3`
- Reports → `Flag`
- Platform Settings → `Sliders`
- Admin Settings → `Shield`

Features:
- Collapsible sidebar (icon-only mode)
- Active route highlighting
- Admin avatar + sign out at bottom
- Badge on Event Moderation showing pending count
- Mobile: slide-out drawer

---

### Page 1 — Admin Overview (`/admin`)

**File**: `src/pages/admin/AdminOverview.tsx`

Sections:
1. **Metric cards row** (6 cards): Total Events, Pending Approvals, Total Users, Total Registrations, Events Today, Active Events — each with icon and subtle trend indicator
2. **Moderation Queue** — compact table of pending events with Approve/Reject/View buttons (reuses PendingEventsTable logic)
3. **Recent Activity** — timeline feed (reuses ActivityFeed component)
4. **Mini Analytics** — 2x2 grid of small Recharts: events/day, signups/week, registrations trend, category pie

### Page 2 — Event Moderation (`/admin/events/pending`)

**File**: `src/pages/admin/AdminEventModeration.tsx`

Card-based review layout:
- Each pending event as a rich card (cover image, title, host, date, location, category, description snippet)
- Action buttons: Approve, Reject, Request Changes, View Full Event
- Side preview panel (dialog) showing how event looks in Discover
- Reuses and enhances existing `PendingEventsTable` logic

### Page 3 — All Events (`/admin/events`)

**File**: `src/pages/admin/AdminAllEvents.tsx`

Enhanced data table:
- Columns: Title, Host, Date, Category, Guests (count from event_guests), Status, Created At, Actions
- Status badges with colors: Draft (gray), Pending (orange), Approved (green), Rejected (red), Past (muted)
- Actions dropdown: View, Edit, Approve, Reject, Delete, Feature
- Filter bar: Category, Status, Date range, Host search
- Reuses EventsTable component with enhancements

### Page 4 — User Management (`/admin/users`)

**File**: `src/pages/admin/AdminUsers.tsx` — Full rewrite

Full user table:
- Columns: Avatar, Full Name, Email, Role, Events Hosted, Registrations, Join Date, Actions
- Queries: profiles + user_roles + events count + event_guests count
- Actions dropdown: View Profile, Suspend (placeholder), Promote to Admin, Remove Admin, Delete User
- User detail slide-out panel showing profile info, hosted events, activity
- Search by name/email

### Page 5 — Registrations (`/admin/registrations`)

**File**: `src/pages/admin/AdminRegistrations.tsx`

Registration monitoring table:
- Columns: Event, Guest Name, Email, Registration Time, Status, Check-in Status
- Queries event_guests joined with events
- Filters: Event, Date, Host, Checked-in status
- Actions: View details, Export CSV (using existing papaparse), Remove registration
- Stats row at top: Total Registrations, Checked In, Pending

### Page 6 — Analytics (`/admin/analytics`)

**File**: `src/pages/admin/AdminAnalytics.tsx` — Enhanced

Reuses existing analytics components but adds:
- Time range filter (7d, 30d, 90d, All time) that passes to child components
- Registration trend chart (new)
- Top Hosts leaderboard (new)
- Cleaner layout with the new admin design

---

### Routing Changes

**File**: `src/App.tsx`

Replace current 4 admin routes with:
```
/admin                    → AdminOverview
/admin/events/pending     → AdminEventModeration
/admin/events             → AdminAllEvents
/admin/users              → AdminUsers
/admin/registrations      → AdminRegistrations
/admin/categories         → placeholder
/admin/analytics          → AdminAnalytics
/admin/reports            → placeholder
/admin/settings/platform  → placeholder
/admin/settings/admin     → placeholder
```

All wrapped in `<ProtectedRoute>` with admin check inside each page component.

---

### Files Created
- `src/pages/admin/AdminOverview.tsx`
- `src/pages/admin/AdminEventModeration.tsx`
- `src/pages/admin/AdminAllEvents.tsx`
- `src/pages/admin/AdminUsers.tsx`
- `src/pages/admin/AdminRegistrations.tsx`
- `src/pages/admin/AdminAnalytics.tsx`
- `src/pages/admin/AdminCategories.tsx` (placeholder)
- `src/pages/admin/AdminReports.tsx` (placeholder)
- `src/pages/admin/AdminPlatformSettings.tsx` (placeholder)
- `src/pages/admin/AdminSettingsPage.tsx` (placeholder)

### Files Modified
- `src/components/admin/AdminLayout.tsx` — Full rewrite with 10-item sidebar
- `src/App.tsx` — New admin routes
- Migration SQL for admin email + new tables

### Files Removed
- `src/pages/OrganizerDashboard.tsx`
- `src/pages/AdminAnalytics.tsx`
- `src/pages/AdminUsers.tsx`
- `src/pages/AdminSettings.tsx`

### Design Approach
- Dark sidebar (`bg-slate-950` in light mode, `bg-card` in dark) for visual separation from user UI
- Content area uses `bg-muted/30` background
- Cards with subtle borders, no heavy shadows
- Data tables with clean row styling
- Badge-based status indicators
- Dropdown menus for multi-action cells
- No bright colors — monochrome teal accents only

