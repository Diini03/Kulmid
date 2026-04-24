## Plan: Dynamic Event Registration Form Builder

### Goal
Make the current Registration tab feel like a simple Google Forms-style builder for organizers, while keeping Kulmid’s existing design and database structure.

### Important Existing Foundation
The project already has most of the backend structure needed:
- `event_registration_fields` stores default fields like name, email, phone, organization.
- `event_registration_questions` stores custom questions with type, options, required status, and order.
- `event_registration_answers` stores attendee responses linked to a registration.

So I will improve and expand the existing system instead of redesigning everything or creating a separate duplicated schema.

### What Will Change

#### 1. Upgrade the organizer Registration tab
In `EventBuilderRegistration`, replace the current basic custom-question section with a cleaner builder experience:
- Keep default fields section for name, email, phone, organization.
- Add a more professional “Custom form builder” area.
- Add an “Add Question” modal instead of the inline add form.
- Add clear question type selection with simple descriptions.
- Add required/optional toggle.
- Add option editor for choice-based questions.
- Add reorder controls and edit/delete actions.
- Add empty states and helper text for non-technical users.

#### 2. Support the requested question types
Map the requested public question types to the existing database field `question_type`:
- `text` → short text input
- `textarea` → long text input
- `multiple_choice` → radio/select-style single choice
- `checkbox` → multiple selections
- `dropdown` → dropdown select
- `phone` → phone input
- `email` → email input
- `social_link` → URL/social profile input

Choice-based question types will require at least 2 options.

#### 3. Add live preview before saving
Inside the Registration tab:
- Add a preview panel/card that shows exactly how the registration form will look to attendees.
- Preview default fields plus custom questions.
- On desktop, show builder and preview in a clean two-column layout where appropriate.
- On mobile, stack builder and preview vertically.

#### 4. Update dynamic attendee form rendering
In `SimpleRegistrationForm`, support all new question types:
- Text input
- Textarea
- Email input with validation
- Phone input
- Social link / URL input
- Dropdown
- Multiple choice
- Checkbox/multi-select

The registration dialog will remain compact and mobile-friendly.

#### 5. Store answers in a scalable JSON-friendly way
Use the current `event_registration_answers` table but make it flexible:
- Text, email, phone, textarea, social link answers go into `answer_text`.
- Dropdown/multiple choice answers go into `answer_option`.
- Checkbox/multi-select answers can be stored as a JSON string in `answer_text` unless we add a dedicated JSONB column later.

This keeps the feature working with the current schema and avoids unnecessary database restructuring.

### Technical Details
Files likely to change:
- `src/components/events/EventBuilderRegistration.tsx`
- `src/components/events/registration/SimpleRegistrationForm.tsx`
- `src/components/events/EventRegistrationDialog.tsx` if answer typing needs to be widened

Potential optional database improvement:
- Add `answer_json jsonb` to `event_registration_answers` for checkbox/multi-select responses.
- I recommend doing this only if you want the cleanest long-term data model. The feature can work without it by storing checkbox answers as JSON text.

### Validation Rules
- Question title is required.
- Choice questions require at least 2 non-empty options.
- Required attendee questions must be answered before submission.
- Email questions must be valid email format.
- Social link questions should be a valid URL or accepted social handle-style link.
- Inputs will be trimmed and length-limited.

### What Will Not Change
- No full system redesign.
- No change to the Event Builder structure.
- No change to the event creation flow.
- No new EmailJS usage.
- Existing registrations and existing questions will continue to work.