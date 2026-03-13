

# Admin Reporting Center — Full Rewrite

## Approach

Rewrite `AdminReports.tsx` into a tabbed reporting center with 5 tabs: **Events**, **Registrations**, **Organizers**, **Categories**, and **Moderation**. Each tab fetches its own data, shows a summary chart, a filterable table, and supports CSV/PDF export. The existing moderation code moves into the Moderation tab.

## Structure

```text
┌─────────────────────────────────────────────────┐
│ Reporting Center          [Date Range] [CSV][PDF]│
├─────────────────────────────────────────────────┤
│ [Total Events] [Approved] [Pending] [Regs] [Reports] │
├─────────────────────────────────────────────────┤
│ Events | Registrations | Organizers | Categories | Moderation │
├─────────────────────────────────────────────────┤
│  [Chart]  +  [Filters]  +  [Table]              │
└─────────────────────────────────────────────────┘
```

## Implementation — Single File Rewrite

**`src/pages/admin/AdminReports.tsx`** — complete rewrite (~900 lines)

### Global elements (always visible)
- Header: "Reporting Center" + date range picker (two date inputs) + Export CSV / Export PDF / Print buttons
- 6 summary stat cards fetched once: Total Events, Approved Events, Pending Events, Total Registrations, Active Organizers, Moderation Reports
- Tabs component with 5 tabs

### Tab A: Event Reports
- Data: fetch `events` with `created_at` in date range
- Mini bar chart (recharts): events created per month, colored by status
- Filters: status, category, search (title/host/location)
- Table: Title, Organizer (host_name), Category, Date, Location, Status, Registrations (from event_guests count)
- Actions: View Event link, export respects filters

### Tab B: Registration Reports
- Data: fetch `event_guests` with join on events for title, filtered by date range
- Mini line chart: registrations over time (daily)
- Filters: event, check-in status, registration status, search
- Table: Event, Guest Name, Email, Status, Check-in, Registered At
- Aggregates row: total regs, total checked in

### Tab C: Organizer Reports
- Data: aggregate from `events` grouped by `created_by`, join `profiles` for name
- Mini horizontal bar chart: top 5 organizers by event count
- Table: Organizer Name, Events Hosted, Approved, Rejected, Pending, Total Registrations
- Filters: search, sort by events/registrations

### Tab D: Category Reports
- Data: aggregate from `events` grouped by `category`
- Mini pie chart: category distribution
- Table: Category, Events, Registrations, Approved, Pending, Rejected
- No complex filters needed — date range is enough

### Tab E: Moderation Reports
- Preserves all existing moderation functionality (report table, detail sheet, status updates, reject event action, related reports, timeline, admin notes)
- Filters: status, type, priority, search
- Same export logic

### Export & Print
- CSV/PDF export functions switch based on active tab
- Each tab's export includes: report title, date range, filter summary, table data, totals
- Print button calls `window.print()` with print-friendly styles

### Date Range
- Two `<Input type="date" />` inputs for start/end
- Default: last 30 days
- All tabs filter their queries by this range

## Charts
- Use recharts (already installed) — `BarChart`, `LineChart`, `PieChart`
- Compact charts (~200px height) above each tab's table
- Consistent teal/emerald color palette matching admin theme

## Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminReports.tsx` | Full rewrite — tabbed reporting center |

**Total: 1 file modified. No migrations needed.**

