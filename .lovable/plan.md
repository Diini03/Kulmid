

# Custom Registration Questions — Plan

## Overview

Add organizer-configurable registration forms: toggle built-in fields, add custom questions, render them dynamically on the attendee form, and store answers separately.

## Database Changes (3 new tables via migration)

### `event_registration_fields`
Stores per-event configuration of built-in fields (name, email, phone, organization).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| event_id | text NOT NULL | references events(id) on delete cascade |
| field_key | text NOT NULL | e.g. 'name', 'email', 'phone_number', 'organization' |
| label | text NOT NULL | display label |
| is_enabled | boolean | default true |
| is_required | boolean | default false |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |

RLS: event owner can SELECT/INSERT/UPDATE/DELETE. Admins can SELECT all. Public can SELECT (needed for registration form rendering).

### `event_registration_questions`
Organizer-created custom questions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | text NOT NULL | references events(id) on delete cascade |
| question_text | text NOT NULL | |
| question_type | text NOT NULL | 'short_text', 'long_text', 'single_select', 'boolean' |
| is_required | boolean | default false |
| options | jsonb | for single_select choices |
| sort_order | integer | default 0 |
| is_active | boolean | default true |
| created_at / updated_at | timestamptz | |

RLS: same pattern — owner manages, public can read.

### `event_registration_answers`
Stores attendee answers to custom questions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| registration_id | uuid NOT NULL | references event_guests(id) on delete cascade |
| question_id | uuid NOT NULL | references event_registration_questions(id) |
| answer_text | text | for short/long text |
| answer_boolean | boolean | for yes/no |
| answer_option | text | for single_select |
| created_at | timestamptz | |

RLS: public can INSERT (registration flow). Event owner can SELECT.

### Seed defaults
A database function `initialize_event_registration_fields()` that inserts default field config rows when an event is created (via trigger on `events` insert).

## New Components

### `EventBuilderRegistration.tsx` — Organizer settings UI
New tab "Registration" in EventBuilder between Guests and Edit.

**Built-in fields section:**
- List of 4 fields with toggle switches (enabled/disabled, required/optional)
- Name and Email always enabled+required (disabled toggles)

**Custom questions section:**
- "Add Question" button → inline form: question text, type selector, required toggle
- For `single_select`: editable options list
- Each question shows as a card with edit/delete/reorder controls
- Drag handle or up/down arrows for ordering

### Update `SimpleRegistrationForm.tsx` — Dynamic attendee form
- Accept `eventId` prop, fetch field config + custom questions on mount
- Render only enabled built-in fields
- Render custom questions after built-in fields using appropriate input types
- Validate required fields dynamically

### Update `EventRegistrationDialog.tsx` — Submission logic
- After inserting into `event_guests`, insert answers into `event_registration_answers`
- Pass `eventId` to `SimpleRegistrationForm` for dynamic field fetching

## Files to Change

| File | Change |
|------|--------|
| **Migration** | Create 3 tables + trigger for default field seeding |
| `src/pages/EventBuilder.tsx` | Add "Registration" tab |
| `src/components/events/EventBuilderRegistration.tsx` | **New** — organizer form config UI |
| `src/components/events/registration/SimpleRegistrationForm.tsx` | Make dynamic — fetch config, render conditionally |
| `src/components/events/EventRegistrationDialog.tsx` | Pass eventId, handle custom answer submission |

**5 files modified/created. 1 migration. 0 edge functions.**

