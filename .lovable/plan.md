

# UX Refinement Plan — Edit Flow, Guests UX, Identity Adjustments

## 1. Edit Flow — Edit Lock System (Option B)

Replace the always-editable "Edit" tab with a locked-by-default pattern.

**In `EventBuilder.tsx`:**
- Keep the "Edit" tab but rename it to "Edit"
- Pass a new `locked` prop to `EventBuilderEdit`

**In `EventBuilderEdit.tsx`:**
- Add a lock state (`editing = false` by default)
- When locked: show all fields as read-only with a prominent "Unlock Editing" button + lock icon
- When unlocked: show fields as editable (current behavior)
- Unlocking shows a brief confirmation toast: "Editing enabled — remember to save"
- All form inputs get `disabled={!editing}` with reduced opacity styling

## 2. Guests Section — Summary Stats Bar

**In `EventBuilderGuests.tsx`:**
- Add a stats bar above the tabs showing: Total Guests | Registered | Checked In | Pending
- Fetch total registration count alongside existing queries
- Stats update when scanner dialog closes or tab data refreshes

```text
┌─────────────────────────────────────────────┐
│  Total: 120   Registered: 85   Checked In: 45   Pending: 35  │
└─────────────────────────────────────────────┘
[ Invitations | Registrations | Checked In ]
```

## 3. Guests — Filters Inside Checked In Tab

**In `CheckedInTab.tsx`:**
- Already has data. Add a search/filter input at top to filter by name or email
- Show initials avatar circle for each guest row (first letter of name, colored)

**In `RegistrationsTab.tsx`:**
- Already has filter buttons (All / Pending / Approved / Rejected) — no change needed

## 4. Visual Identity Adjustments

**A. Status badges consistency** — in `RegistrationsTab.tsx` and `EventBuilderOverview.tsx`:
- Pending → `warning` variant (yellow)
- Approved/Registered → `success` variant (green)  
- Rejected → `destructive` variant (red)
- Use existing badge variants from `badge.tsx` which already has `warning` and `success`

**B. Button hierarchy** — in `EventBuilderOverview.tsx`:
- "View Event Page" → primary button (default variant)
- "Copy Link" → secondary/outline button
- Swap the order so primary action comes first

**C. Card styling refinements:**
- Add slightly more padding to guest list rows
- Use `border-border/60` for softer borders on cards

**D. EventCard.tsx:**
- Soften the card border: `border-border/50`
- Add `shadow-sm` for subtle depth instead of flat border

## 5. Files to Change

| File | Changes |
|------|---------|
| `src/pages/EventBuilder.tsx` | Rename Edit tab label, no structural change |
| `src/components/events/EventBuilderEdit.tsx` | Add edit lock state, disabled fields, unlock button |
| `src/components/events/EventBuilderGuests.tsx` | Add summary stats bar above tabs |
| `src/components/events/CheckedInTab.tsx` | Add search filter, initials avatar |
| `src/components/events/EventBuilderOverview.tsx` | Swap button order, use primary for "View Event", softer borders |
| `src/components/events/EventCard.tsx` | Soften border, add subtle shadow |
| `src/components/events/RegistrationsTab.tsx` | Use `success`/`warning` badge variants |

**7 files modified. 0 new files. 0 migrations.**

