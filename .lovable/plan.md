

# Horizontal Category Chips + Modern Date Picker

## Two Changes

### 1. Category as horizontal selectable chips

Replace the dropdown `Select` with a horizontal scrollable row of chip buttons — same pattern as the Event Format (In-Person / Online / Hybrid) radio cards already used in the form. Each chip shows the category icon from `categories.ts` and name.

Applies to both `Create.tsx` and `EventForm.tsx` (admin form).

### 2. Start Date + End Date with modern design

Currently: single `datetime-local` input for `date`.

New design: two side-by-side styled date-time inputs — "Start" and "End" — inside a card-like container with calendar icons and labels. The end date is optional (some events are single-session).

This requires:
- **Database migration**: Add `end_date` column to `events` table (nullable timestamp)
- **Types update**: Will auto-sync after migration
- **Form schema**: Add optional `end_date` field, validate end > start
- **Submit logic**: Save `end_date` to database
- **Display**: Update `EventView.tsx` to show date range when end_date exists

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/...` | Add `end_date` column to events |
| `src/integrations/supabase/types.ts` | Add `end_date` to events type |
| `src/pages/Create.tsx` | Horizontal category chips + start/end date inputs |
| `src/components/admin/EventForm.tsx` | Same category + date changes for admin form |
| `src/pages/EventView.tsx` | Display date range when end_date exists |

**5 files. 1 migration.**

