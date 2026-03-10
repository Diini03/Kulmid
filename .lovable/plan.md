

## Add Free/Paid Toggle with Payout Phone Number

### Overview
Replace the plain price input with a **Free/Paid toggle button**. Default is "Free". When "Paid" is selected, reveal a price field and a payout phone number field (where creators receive their earnings). Phone numbers are validated for Somali format.

### Database Change
Add a `payout_phone` column to the `events` table:
```sql
ALTER TABLE public.events ADD COLUMN payout_phone text;
```
This keeps `host_phone` for contact purposes and `payout_phone` for payment/earnings.

### UI Design

```text
Ticket Pricing
+----------+----------+
|   Free   |   Paid   |   (toggle buttons, "Free" selected by default)
+----------+----------+

-- When "Paid" is clicked: --

Price ($)        [__________]
Payout Phone     [+252 _________]
  "We'll send your earnings to this number"
```

### Phone Validation
Somali mobile numbers must start with `+252` followed by valid prefixes:
- `61, 62, 63, 68` (Hormuud/EVC Plus)
- `71, 77` (Telesom/Zaad)
- Other valid: `65, 66, 69, 70, 73, 74, 76, 78, 79, 90`

Regex pattern: `/^\+252(61|62|63|65|66|68|69|70|71|73|74|76|77|78|79|90)\d{7}$/`

### Files to Change

**1. `src/pages/Create.tsx`** (user event creation form)
- Add `isPaid` state (default `false`)
- Replace the price input with a Free/Paid toggle (two styled buttons)
- When "Free": set price to 0, hide price + payout phone fields
- When "Paid": show price input + payout phone input with Somali validation
- Add `payout_phone` to the Zod schema (required when price > 0)
- Save `payout_phone` to the database on submit

**2. `src/components/admin/EventForm.tsx`** (admin event form)
- Same Free/Paid toggle pattern
- Same payout phone field with validation

**3. `src/components/events/EventBuilderEdit.tsx`** (event builder edit tab)
- Same Free/Paid toggle pattern
- Same payout phone field with validation

### Validation Schema Update (in all 3 forms)
```typescript
payout_phone: z.string()
  .regex(/^\+252(61|62|63|65|66|68|69|70|71|73|74|76|77|78|79|90)\d{7}$/, 
    "Enter a valid Somali phone number (e.g. +252611234567)")
  .optional()
  .or(z.literal(""))
```

With a `.refine()` to make it required when price > 0:
```typescript
.refine((data) => {
  if (data.price > 0) {
    return !!data.payout_phone && data.payout_phone.length > 0;
  }
  return true;
}, {
  message: "Payout phone number is required for paid events",
  path: ["payout_phone"],
})
```

### What This Does NOT Include (for later)
- Attendee payment flow (how users pay for paid events)
- WAAFI API integration
- Admin dashboard paid event details view
- Payout tracking system
