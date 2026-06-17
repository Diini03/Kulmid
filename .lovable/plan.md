## Export `event_guests` as your assignment dataset (anonymized CSV)

A one-off data export from the `event_guests` table — no code or schema changes to the app.

### What you'll get
A single file: `/mnt/documents/event_guests_dataset.csv`

- **Rows:** ~115 (you said you may add more — this already passes the ≥50 requirement)
- **Columns:** 12 features + 1 label (well above the ≥5 requirement)

### Columns in the export

| # | Column | Type | Role | Notes |
|---|---|---|---|---|
| 1 | `guest_id_short` | text | id | first 8 chars of UUID (anonymized) |
| 2 | `email_domain` | categorical | feature | e.g. `gmail.com` — full email dropped |
| 3 | `name_initials` | text | feature | e.g. `A.M.` — full name dropped |
| 4 | `has_phone` | boolean | feature | derived from phone_number |
| 5 | `organization` | categorical | feature | free-text (has typos/missing — quality issue) |
| 6 | `job_title` | categorical | feature | free-text |
| 7 | `degree` | categorical | feature | many nulls (quality issue) |
| 8 | `heard_from` | categorical | feature | imbalanced (quality issue) |
| 9 | `dietary_restrictions` | categorical | feature | mostly null |
| 10 | `registration_type` | categorical | feature | rsvp / registration |
| 11 | `status` | categorical | feature | registered / pending / rejected |
| 12 | `days_between_register_and_event` | numeric | feature | computed: event.date − created_at |
| 13 | **`checked_in`** | **boolean** | **label (y)** | **the target for supervised classification** |

### Why this dataset fits the assignment
- **Supervised — Binary Classification:** predict `checked_in` from the 12 features.
- **Built-in quality issues** for your "Quality Issues" section: missing values (degree, dietary_restrictions), free-text typos (organization, job_title), class imbalance (most guests don't check in), duplicates possible across events.
- **Lifecycle fit:** sits in the *Data Collection → Cleaning → Modeling* stages.

### Steps I'll run (after you approve)
1. Query `event_guests` joined with `events` (only to compute `days_between_register_and_event`).
2. Anonymize email → domain only, name → initials only, drop phone number.
3. Write `/mnt/documents/event_guests_dataset.csv` and surface it as a downloadable artifact.

No database, RLS, or app code will be modified.