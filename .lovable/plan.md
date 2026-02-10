

## Reposition Category + Smart Category-Format Matching

### 1. Move Category Before Description

Currently the form order is: Title -> Description -> Date -> Event Format -> Location -> **Category** + Price

New order: Title -> **Category** -> Description (with AI button) -> Date -> Event Format -> Location -> Price

This makes category available before the user writes or generates a description, which is important because the "Suggest with AI" feature uses category as context.

### 2. Smart Category-Format Linking

When the user selects **Webinar**, the form should:
- Auto-set Event Format to **"online"**
- Hide the location field (show only meeting link)
- Optionally show a subtle note like "Webinars are online events"

Other categories keep the current behavior (user picks in-person/online/hybrid freely).

### Technical Details

**File: `src/pages/Create.tsx`**

**Field reordering (lines 366-607):**
- Move the Category `FormField` (currently at lines 560-584) to right after the Title field (after line 383)
- Category becomes a standalone full-width field (no longer paired with Price in a grid)
- Price stays in its current position

**Category-format auto-set:**
- Add a `useEffect` watching the `category` field
- When category changes to `"Webinar"`, auto-set `event_type` to `"online"` and clear `location`
- When switching away from Webinar, don't force a change (let user pick)
- Optionally disable the Event Format radio group when Webinar is selected, with a helper note

**Same changes in `src/components/admin/EventForm.tsx`** for the admin form.

### Summary

| Change | What Happens |
|--------|-------------|
| Category moves up | Appears right after Title, before Description |
| Webinar auto-sets online | Selecting Webinar switches format to online, hides location |
| AI gets better context | Category is filled before user clicks "Suggest with AI" |
| Price stays put | Remains in its current position near the bottom |

**Files to modify:** `src/pages/Create.tsx`, `src/components/admin/EventForm.tsx`

