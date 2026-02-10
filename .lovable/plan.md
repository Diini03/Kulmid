

## Update Create Event Form: Categories + Collapsible Host Section

### 1. Update Categories Across the App

**Replace Sports** with two new categories: **Webinar** and **Meetup**. The final list becomes 6 categories:

| Category | Icon | Description |
|----------|------|-------------|
| Seminar | GraduationCap | Educational talks and presentations |
| Workshop | Wrench | Hands-on learning experiences |
| Conference | Users | Professional networking events |
| Festival | Music | Cultural celebrations and entertainment |
| Webinar | Monitor | Online educational sessions |
| Meetup | Handshake | Casual gatherings and community networking |

**Files to update (8 files):**

- `src/constants/categories.ts` -- Add Webinar and Meetup, remove Sports from the type and config array
- `src/data/events.ts` -- Update the EventCategory type, replace the Sports sample event with a Webinar or Meetup example
- `src/pages/Create.tsx` -- Update the zod enum and Select options
- `src/components/admin/EventForm.tsx` -- Same zod enum and Select updates
- `src/constants/onboarding.ts` -- Update the category options list
- `src/pages/HomePage.tsx` -- Update the categories filter array
- `src/pages/OrganizerDashboard.tsx` -- Update the categories filter array
- `src/components/events/SearchBar.tsx` -- Update the Select options

Note: Existing events in the database with category "Sports" will still display correctly -- they just will not appear in filter dropdowns unless a user types it. No database migration is needed since `category` is a free text column.

---

### 2. Collapsible Host Section with Auto-Fill

**Current behavior:** Host section is always visible with 4 fields (name, description, email, phone). Name is required, and at least one contact method (email or phone) is required.

**New behavior:**
- Host section is **collapsed by default** behind a toggle/switch labeled "Add custom host details"
- When collapsed, the form auto-fills `host_name` with the user's profile name and `host_email` with the user's email (from auth)
- When the user expands it, they see the 4 fields pre-filled and can edit
- Validation: `host_name` is always auto-set (from profile or manual entry), so validation stays intact

**Technical approach in `src/pages/Create.tsx`:**
- Add a `showHostDetails` state (default: `false`)
- Use a Switch component to toggle visibility
- On mount (and when toggle is off), auto-fill `host_name` from `profile?.full_name` and `host_email` from `user?.email`
- When toggled on, show the existing host fields pre-filled so the user can customize
- Remove the "at least one contact method" zod refinement since email will always be auto-filled
- Apply the same pattern to `src/components/admin/EventForm.tsx`

---

### Summary of Changes

| Area | What Changes |
|------|-------------|
| Categories | Replace "Sports" with "Webinar" + "Meetup" across 8 files |
| Host Section (Create.tsx) | Add collapsible toggle, auto-fill from profile |
| Host Section (EventForm.tsx) | Same collapsible toggle pattern |
| Validation | Simplify host validation since email auto-fills |

