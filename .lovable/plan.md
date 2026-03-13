

# Admin Reporting & Moderation System

## Current State

The `reports` table already exists with columns: `id`, `type`, `target_id`, `reported_by`, `reason`, `status`, `created_at`, `resolved_at`, `resolved_by`. RLS is in place (admins manage all, authenticated users can insert). The `AdminReports.tsx` page exists but is minimal — no description field, no enriched target data, no user-facing report submission UI, and limited admin actions.

## What Will Be Implemented

### Phase 1: Database — Add `description` column and `admin_notes` column

Add two columns to `reports`:
- `description` (text, nullable) — detailed report explanation from the reporter
- `admin_notes` (text, nullable) — admin's internal notes when resolving

Migration SQL:
```sql
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes text;
```

### Phase 2: Report Submission UI

**A. ReportEventDialog component** (`src/components/events/ReportEventDialog.tsx`)
- Triggered from a "Report" button on `EventView.tsx` and `EventDetails.tsx`
- Form fields: reason (select from predefined list), description (textarea)
- Predefined reasons: Inappropriate content, Misleading information, Scam/fraud, Spam, Duplicate event, Fake event, Wrong category, Copyright violation, Unsafe activity
- Submits to `reports` table with `type: 'event'`, `target_id: event.id`, `reported_by: user.id`
- Requires authentication — show auth modal if not logged in
- Success toast, prevents duplicate reports (check if user already reported this event)

**B. Add Report button to EventView.tsx and EventDetails.tsx**
- Small "Report" link/button near the share button
- Only visible to authenticated users (or shows auth prompt)

### Phase 3: Enhanced AdminReports Page

Complete rewrite of `AdminReports.tsx` with:

**A. Stats cards** — keep existing (total, open, reviewing, resolved)

**B. Enriched report table**
- Fetch reporter profile name via join: `profiles:reported_by(full_name)`
- For event-type reports, fetch event title by doing a secondary lookup or storing it
- Show: type icon, reason, description preview, reporter name, target name, date, status, report count badge (how many reports share the same target_id)
- Filters: status, type (event/user/system/platform)

**C. Report detail dialog** — enhanced with:
- Full description text
- Reporter info (name)
- For event reports: link to view event, event title, organizer
- Admin notes textarea (editable, saved on resolve/dismiss)
- Status workflow buttons: Open → Under Review → Resolved/Dismissed
- Quick admin actions for event reports: "Reject Event", "View Event"
- Processing states on all action buttons

**D. Report count badges**
- Group reports by `target_id` and show count next to each (e.g., "3 reports" badge)
- Prioritize targets with multiple reports

### Phase 4: Admin Actions from Reports

When resolving an event report, provide inline actions:
- **View Event** — link to `/events/{id}` in new tab
- **Reject Event** — calls supabase update on events table, sets status to 'rejected' with reason
- **Dismiss Report** — marks as dismissed with optional admin notes

All actions use `useProcessingSet` for per-item loading states.

## Files Changed

| File | Change |
|------|--------|
| 1 migration | Add `description` and `admin_notes` columns |
| `src/components/events/ReportEventDialog.tsx` | New — report submission form |
| `src/pages/EventView.tsx` | Add Report button |
| `src/pages/EventDetails.tsx` | Add Report button |
| `src/pages/admin/AdminReports.tsx` | Full enhancement |

**Total: 1 migration, 1 new component, 3 modified files.**

## What Cannot Be Solved Here

| Item | Reason |
|------|--------|
| Automated system alerts (registration spikes) | Requires `pg_cron` or scheduled edge function for anomaly detection |
| User-to-user reporting (report a user profile) | No public user profile pages exist yet to attach a report button; can be added when profile pages are implemented |
| Rate limiting on report submissions | Requires server-side rate limiting infrastructure |

