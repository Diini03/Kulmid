# Event Insights & Analytics — Plan

Build a new **Insights** tab inside the event builder that auto-generates analytics from the existing dynamic registration schema (`event_registration_questions` + `event_registration_answers`), and add an **Individual Response Viewer** to the Guests tab.

No schema changes required — the data model already supports everything (questions are stored with type/options, answers are linked by `registration_id` → `event_guests.id`).

---

## 1. New Insights Tab

**File:** `src/pages/EventBuilder.tsx`
- Add a 4th tab `"insights"` in the order: **Overview · Guests · Registration · Insights · Edit · Settings** (keeping Edit/Settings after, so the user-facing first 4 match their spec).
- Render `<EventBuilderInsights eventId={event.id} />`.

**New file:** `src/components/events/EventBuilderInsights.tsx`

Top-level layout (consistent with current `max-w-5xl`, monochrome teal style, Card-based):
1. **Overview Metrics row** — 4 stat cards
   - Total registrations (count of `event_guests` where `registration_type='registration'`)
   - Approved / Registered (`status='registered'`)
   - Pending (`status='pending'`)
   - Checked in (`checked_in=true`)
2. **Gender summary card** (only rendered if a gender-like question is detected — see §3)
3. **Per-question analytics cards** — one card per supported question (see §2)
4. **Open-text questions section** — list with sample answers + "View all responses" link to Individual Response Viewer
5. **Empty states** — when no registrations or no custom questions, show "No data available yet" card.
6. **Export button** (top-right) — CSV download of all responses (questions as columns).

---

## 2. Dynamic Question Analytics

**Data fetch (single page-load aggregation):**
- Fetch active questions: `event_registration_questions` where `event_id=? AND is_active=true` ordered by `sort_order`.
- Fetch all approved/pending guests for the event: `event_guests` (id, name, email, status, checked_in).
- Fetch all answers for those guests: `event_registration_answers` where `registration_id IN (...)`.
- Aggregate client-side into `Map<question_id, Map<option, count>>`.

**Per-question rendering by type** (using existing `LEGACY_TYPE_MAP` + `getQuestionType` helpers, copied/imported from `EventBuilderRegistration.tsx`):
- **multiple_choice / dropdown** — read `answer_option`. Render bar chart with option label, count, percentage of total responses.
- **checkbox** — read `answer_text` (stored as JSON-stringified array per `SimpleRegistrationForm`). Parse and count each option independently. Total = number of respondents (not selections).
- **text / textarea / phone / email / social_link** — no chart. Show response count + "View responses" button that opens the Individual Response Viewer filtered to that question, OR shows up to 3 sample answers inline.

**Bar visualization:** simple horizontal CSS bars (`<div>` with width %) using primary teal color — no chart library needed. Mobile-responsive.

**Performance:** all aggregation happens once on mount in JS (registrations are typically <1000). No precompute table needed for MVP. Memoize aggregations with `useMemo`.

---

## 3. Gender Detection

**Detection logic** (in insights component):
```ts
const isGenderQuestion = (q) =>
  /gender|jinsi|sex/i.test(q.question_text) &&
  ['multiple_choice', 'dropdown', 'checkbox'].includes(getQuestionType(q.question_type));
```

If detected, render a dedicated **Gender Summary card** above per-question cards:
- Bucket each option's count into male / female / other based on label match (`/^male|lab|man$/i`, `/^female|dumar|woman$/i`, else other).
- Display as 3 stat tiles + simple percentage bars (no pie chart needed for MVP — keeps consistent with monochrome style).

The same gender question still appears in the per-question cards below (no duplication suppression — it provides both summary and detail view).

---

## 4. Individual Response Viewer

**Entry point:** Guests tab → `RegistrationsTab.tsx`
- Each registration row already has an expand/collapse button. Add a new **"View full response"** button (next to Approve/Reject) that opens a modal.

**New file:** `src/components/events/RegistrationResponseDialog.tsx`
- Props: `guestId`, `eventId`, `open`, `onOpenChange`.
- Fetches the guest record + all answers for that guest joined with their questions.
- Renders:
  - Header: name, email, phone, status badge
  - Section: **Default fields** (organization, job_title, etc. — fields that have values on `event_guests`)
  - Section: **Custom answers** — each question text followed by the answer (formatted by type: checkbox arrays as bullet list, boolean as Yes/No, etc.)
- Uses existing Dialog component for consistency.

Also wire the same dialog into the Insights tab's "View responses" buttons on text/textarea cards (opens the dialog seeded with the first respondent, with prev/next nav — optional, defer to v2 if scope creeps).

---

## 5. CSV Export (Optional but included)

**Util:** `src/lib/exportRegistrations.ts`
- Builds a CSV with columns: `Name, Email, Phone, Status, Checked In, [each question text...]`.
- Each row = one registration. Checkbox answers join with `; `.
- Triggers browser download via Blob + anchor click. No backend needed.

Button placement: top-right of Insights tab, "Export CSV" with download icon.

---

## 6. Files Touched

**New:**
- `src/components/events/EventBuilderInsights.tsx`
- `src/components/events/RegistrationResponseDialog.tsx`
- `src/lib/exportRegistrations.ts`

**Edited:**
- `src/pages/EventBuilder.tsx` — add Insights tab trigger + content
- `src/components/events/RegistrationsTab.tsx` — add "View full response" button + dialog

**No DB migrations.** All RLS policies already permit event owners to read their guests, answers, and questions.

---

## 7. Constraints honored
- No UI redesign — reuses Card, Badge, Dialog, Tabs, monochrome teal palette
- Mobile responsive — grids collapse to 1 col, bars stay full-width
- Fully dynamic — iterates `event_registration_questions`, no hardcoded keys
- Empty states everywhere ("No data available yet")
