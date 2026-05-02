
# Smart Event Insights — Auto-Categorized Analytics

## Goal
Move beyond the current "one chart per question" view. Automatically recognize common demographic questions used by Somali event organizers and turn them into a **prioritized, story-driven analytics dashboard** — like Google Forms / Microsoft Forms summary, but smarter.

## What the model recognizes (auto-detection)

A new `src/lib/insightsCategorizer.ts` utility scans each event's questions and tags them into known **insight categories** using bilingual (English + Somali) keyword + option-pattern matching:

| Category | Keywords (EN / SO) | Option hints |
|---|---|---|
| Gender | gender, sex / jinsi | male, female, lab, dheddig, dumar |
| Marital status | married, marital, status / xaalad guur, qoys | single, married, divorced, guursaday, doob |
| Education level | education, degree, qualification / waxbarasho, shahaado | high school, bachelor, master, phd, dugsi sare, jaamacad |
| Role / Occupation | student, graduate, employed, occupation, profession / arday, qalin-jabiye, shaqaale | student, graduate, working, unemployed |
| Age range | age / da' | 18-24, 25-34, etc. or numeric |
| Language | language / luqad | english, somali, arabic, af-soomaali |
| Location / City | city, region, location / magaalo, gobol | Mogadishu, Hargeisa, Garowe... |
| Source / Heard from | how did you hear, source / sidee maqashay | facebook, instagram, friend, asxaab |

Detection priority: question text match → option pattern match → fallback to plain chart card. Categorization is **non-destructive** — uncategorized questions still render as today.

## New Insights page layout

```text
┌─ Overview metrics (4 KPI tiles, unchanged) ────────────────┐
├─ Smart Highlights (NEW) ───────────────────────────────────┤
│  3 auto-generated insight cards, e.g.:                     │
│  • "62% of registrants are students"                       │
│  • "Most attendees are 25–34 (48%)"                        │
│  • "Top source: Facebook (41%)"                            │
├─ Demographics row (NEW) ───────────────────────────────────┤
│  Gender donut │ Age bars │ Marital pie  (only shown if     │
│                                          detected)         │
├─ Background row (NEW) ─────────────────────────────────────┤
│  Education bars │ Role/Occupation bars                     │
├─ Reach row (NEW) ──────────────────────────────────────────┤
│  Source/Heard-from bars │ Location bars │ Language bars    │
├─ Cross-breakdown (NEW, optional) ──────────────────────────┤
│  e.g. Gender × Role  (small stacked bar)                   │
├─ Other questions ──────────────────────────────────────────┤
│  All non-categorized questions render as today             │
└─ Open-text responses ──────────────────────────────────────┘
```

Sections render only when their category is detected and has answers — no empty placeholders.

## Smart Highlights generator

Function `generateHighlights(categorized, total)` returns the top 3 most "interesting" facts, ranked by:
1. Dominance (one option ≥ 50% of responses)
2. Coverage (category answered by ≥ 70% of registrants)
3. Diversity gap (e.g. heavy skew toward one gender)

Each highlight is a short sentence + small icon + percentage badge. Falls back gracefully if fewer than 3 categories exist.

## Cross-breakdown (Gender × Role)

When **both** Gender and Role/Occupation are detected, compute a 2D matrix and render a compact stacked bar (e.g. "Students: 60% female, 40% male"). Implemented client-side with the same answers array — no extra queries.

## Charts

Use existing recharts (`src/components/ui/chart.tsx` already wraps it) for:
- Donut for Gender (2–3 slices)
- Horizontal bars for Age / Education / Role / Source / Location / Language
- Stacked bar for cross-breakdown

Keep monochrome teal palette (primary + muted shades), consistent with project memory.

## Files

**New**
- `src/lib/insightsCategorizer.ts` — keyword maps, `categorizeQuestions()`, `bucketAnswers()`, `generateHighlights()`
- `src/components/events/insights/SmartHighlights.tsx`
- `src/components/events/insights/CategoryChartCard.tsx` (donut + bar variants)
- `src/components/events/insights/CrossBreakdownCard.tsx`

**Edited**
- `src/components/events/EventBuilderInsights.tsx` — replace gender-only block with categorized sections, keep KPI tiles + per-question fallback + open-text + CSV export
- (No DB migrations needed — uses existing `event_registration_questions` + `event_registration_answers`)

## Constraints respected
- No schema changes, no hardcoded questions — pure pattern detection on existing data
- Bilingual EN/SO matching
- Mobile-responsive grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Monochrome teal, 12px radius, consistent with Kulmid design

## Out of scope (can follow up later)
- Saving "category mappings" per event so organizers can manually re-tag a question
- Time-series of registrations
- Excel export (CSV already exists)

Ready to implement on approval.
