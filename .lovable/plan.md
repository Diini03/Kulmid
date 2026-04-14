

## Plan: UX Improvements — Social Links, Back Nav, Post-Creation Flow, Modal Consistency

### 1. Add Social Media Link Fields to Event Creation Form + Database

**Database migration**: Add 5 new nullable columns to the `events` table:
- `facebook_url text`
- `twitter_url text`
- `instagram_url text`
- `linkedin_url text`
- `website_url text`

**`src/pages/Create.tsx`**:
- Add 5 optional URL fields to the zod schema (validated as URLs, optional)
- Add a collapsible "Social Links (Optional)" section at the end of the form, before submit buttons
- Include these fields in the `eventData` object sent to Supabase
- Use the same input styling as existing fields, grouped with icons (Facebook, Twitter/X, Instagram, LinkedIn, Globe)

**`src/pages/EventDetails.tsx` and `src/pages/EventView.tsx`**:
- Add a "Links" section that only renders if at least one social URL exists on the event
- Display clickable icon buttons for each provided link (opens in new tab)
- Place this section between "Organized By" and "Share Event"

### 2. Modern Back Navigation on Event Pages

**`src/pages/EventDetails.tsx`**:
- Add a subtle back button at the top of the page content (above the image), using `useNavigate(-1)`
- Style: `← Back` with `ArrowLeft` icon, muted text, small size
- Uses `navigate(-1)` for dynamic back behavior (not hardcoded route)

**`src/pages/EventView.tsx`**:
- Already has a `← Back to Kulmid` link in the header — update it to use `navigate(-1)` with label `← Back` so it returns to the actual previous page instead of always going to the homepage

### 3. Post Event Creation Flow Fix

**`src/pages/Create.tsx`** — change the non-admin redirect after event creation:
- Currently redirects to `/event/${id}/builder`
- Change to redirect to `/events` (My Events page)
- Update toast message: "Event submitted for review! Track it in My Events."
- Add an action button in the toast linking to the event builder for those who want to continue editing

### 4. Modal vs Page Consistency Audit

No code changes needed — the current architecture already follows the correct pattern:
- Event detail views are full pages (correct)
- Registration, reporting, AI description, invitations are modals (correct)
- No violations found in the codebase

---

### Technical details

**Files modified**:
- `src/pages/Create.tsx` — schema + form fields + redirect logic
- `src/pages/EventDetails.tsx` — back button + social links section
- `src/pages/EventView.tsx` — back button update + social links section
- Database migration — 5 new columns on `events`

**No breaking changes**: All new columns are nullable with no defaults required. Existing events simply won't show social links (hidden when empty). Back navigation uses browser history, so it works regardless of entry point.

