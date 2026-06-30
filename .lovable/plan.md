
## Scope

Four independent tracks. None touches unrelated code.

---

### 1. Help page redesign (`src/pages/Help.tsx`)

Problem: current layout is a generic hero + chat box + topic grid + FAQ stack. Feels like a template.

Redesign:
- **Two-column app layout** (desktop): left sidebar with searchable category nav (Getting Started, Events, Registration, Check-in, Insights, Billing, Account). Right pane shows either article content or the AI chat.
- **Hero strip** at top: one big search input ("Search help…") with quick-suggestion chips below it (popular questions).
- **Article cards**: each FAQ becomes a card with icon, title, 1-line summary, and "Read more" → opens a Sheet/Dialog with full content. Replaces the cramped accordion.
- **Floating "Ask AI" button** (bottom-right) opens chat in a side Sheet instead of embedding it inline. Keeps focus on self-serve docs, AI is a fallback.
- Mobile: sidebar collapses into a horizontal pill scroller above the cards; floating button stays.
- Uses existing Monochrome Teal tokens, `max-w-6xl`, 12px radius, no new colors.

---

### 2. About page polish (`src/pages/About.tsx`)

Light pass only (full redesign + content cuts deferred per user):
- Tighten section spacing, add subtle section dividers, replace plain text blocks with a values grid (icon + title + 1 line).
- Team section: avatar + name + role cards in a 3-col grid; remove any duplicated mission copy.
- Add a single CTA strip at the bottom ("Create your first event").

---

### 3. Category picker — allow "Other" / custom (Create + Edit event)

Files: `src/pages/Create.tsx`, `src/components/events/EventBuilderEdit.tsx`, `src/hooks/useCategories.ts`.

- Category field becomes a Combobox: shows admin-managed categories + an **"Other (type your own)"** option and a **"Skip / No category"** option.
- When "Other" is picked → reveal a small text input (max 30 chars, validated). Stored in `events.category` as free text.
- When "Skip" is picked → store `null`. Discover filters already tolerate null.
- No DB migration needed (column is already free text). No change to admin Categories CRUD.

---

### 4. Registration Fields builder — Google-Forms style

File: `src/components/events/EventBuilderRegistration.tsx` (+ small extracted subcomponents).

Current pain: dense form with toggles and dropdowns mixed in one row. Hard to scan.

New UX (mirrors Google Forms):
- **Question cards stacked vertically**, each card = one question. Card shows:
  - Big title input (placeholder "Question") at top.
  - Type selector on the right (Short answer / Long answer / Single choice / Multiple choice / Dropdown / Email / Phone / Number / Date).
  - Body area renders a **preview of the answer control** (e.g. radio list for single choice) with inline "+ Add option" and per-option delete.
  - Footer row: Required toggle · Duplicate · Delete · drag handle.
- **Selected card is highlighted** with a left accent bar (teal) and elevated shadow; others are flat — exactly like Google Forms.
- **Floating right-side action rail** next to the selected card: + Add question, + Add section, + Image (future), + Description.
- Drag-and-drop reordering via existing dnd primitives (or simple up/down arrows if dnd not present — confirm during build).
- Built-in fields (Name/Email/Phone/Org) stay in a separate "Required basics" card at the top, with only Enable/Required toggles — not editable as questions.
- Mobile: cards full-width, action rail collapses into a sticky bottom "+ Add question" button.

No schema changes — uses existing `event_registration_questions` table.

---

### 5. QR code expiry after event ends

Files: `supabase/functions/verify-check-in/index.ts`, optionally `src/pages/CheckIn.tsx` for the public view.

- In `verify-check-in`, after loading the event, compute `expiry = event.date + 24h` (matches existing "past" rollover). If `now() > expiry`, return `{ success: false, message: "Check-in closed for this event" }` before any DB write.
- Also block check-in if `event.status = 'past'` or `'rejected'`.
- Public `/checkin?token=…` page shows a friendly "This event has ended" state when the function returns the expired error.
- No new DB column needed; date-based check is sufficient and survives token regeneration.

---

## Technical notes

- All four tracks are frontend-only except #5 which only edits one edge function. No migrations.
- Help redesign extracts `HelpSidebar.tsx`, `HelpArticleCard.tsx`, `HelpArticleSheet.tsx` under `src/components/help/`.
- Registration builder extracts `QuestionCard.tsx`, `QuestionTypeSelect.tsx`, `OptionEditor.tsx` under `src/components/events/registration/builder/`.
- Combobox uses existing `src/components/ui/command.tsx` + `popover.tsx`.

## Out of scope (per user)

- Full About content rewrite + removing sections — explicitly deferred to a later pass.
- Email-sending changes beyond the QR expiry — user mentioned email/QR as the functional area, but only QR expiry is concrete; will ask if anything email-specific is needed after this lands.
