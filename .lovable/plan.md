

# Reports & Moderation Command Center

## Current State
The page has basic stats cards, status/type filters, a reports table with enriched data, and a detail dialog with resolve/dismiss/reject actions. It works but needs: priority system, search, clickable stats, export, better empty states, and richer detail panel.

## What Will Be Implemented

### Phase 1: Database — Add `priority` column

Migration to add `priority` field to `reports` table:
```sql
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
```

Also update `ReportEventDialog.tsx` to auto-assign priority based on reason:
- Critical: "Unsafe or harmful activity"
- High: "Scam or fraud"
- Medium: "Misleading information", "Fake event", "Copyright violation"
- Low: "Duplicate event", "Wrong category", "Spam event", "Inappropriate content"

### Phase 2: Enhanced AdminReports.tsx — Full Rewrite

**A. Stats cards** — Add 5th "High Priority" card. Make all cards clickable to set filters.

**B. Search bar** — Free-text search across event titles, reporter names, reason, description, report ID.

**C. Priority filter** — Add priority dropdown alongside status and type filters.

**D. Priority badges** — Color-coded: critical (red), high (orange), medium (yellow), low (gray).

**E. Table enhancements:**
- Add Priority column with colored badge
- Add report ID column (truncated)
- Improve actions column with dropdown menu (View, Mark Reviewing, Resolve, Dismiss, Reject Event)

**F. Enhanced detail dialog → side sheet:**
- Replace Dialog with Sheet (side panel) for better scanning
- Show full report info + priority badge
- For event reports: fetch and show event status, organizer name, registration count
- Related reports section: list other reports with same `target_id`
- Admin notes (editable)
- Moderation actions with confirmation dialogs:
  - Mark Reviewing / Resolve / Dismiss
  - Reject Event (for event reports)
- Moderation history timeline placeholder (shows created_at → status changes based on resolved_at)

**G. Export capabilities:**
- "Export CSV" button that exports the current filtered view
- "Export PDF" button using jsPDF (already installed)
- Both respect active filters

**H. Empty state** — Better illustration with icon and descriptive text.

### Phase 3: Update ReportEventDialog

Add auto-priority assignment when submitting reports based on reason mapping.

## Files Changed

| File | Change |
|------|--------|
| 1 migration | Add `priority` column |
| `src/pages/admin/AdminReports.tsx` | Full enhancement |
| `src/components/events/ReportEventDialog.tsx` | Add priority auto-assignment |

**Total: 1 migration, 2 files modified.**

