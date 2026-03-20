

# QR Check-In & Confirmation System

## Current State

- **Scanner page** exists at `/event/:eventId/scanner` (EventScanner.tsx) — standalone page, navigates away from Guests
- **Edge function** `verify-check-in` exists but has a bug (reads `req.json()` twice) and is missing from `config.toml`
- **Guests page** has 2 tabs: Invitations, Registrations — no Checked In tab
- **Scanner auto-checks-in** on scan — no confirmation step
- **QR token URL**: `https://kulmid.lovable.app/check-in/{token}`

## Changes

### 1. Fix `verify-check-in` edge function
- Fix double `req.json()` bug — parse body once
- Add `verify_jwt = false` to `config.toml`
- Split into two modes: `action: "verify"` (lookup only, no check-in) and `action: "confirm"` (perform check-in)
- This enables the two-step scan → confirm flow

### 2. Add "Checked In" tab to EventBuilderGuests
- Third tab alongside Invitations and Registrations
- Shows checked-in guests with: name, email, check-in time, status badge
- Badge counter showing checked-in count
- Real-time subscription to `event_guests` for live updates

### 3. Replace scanner page with full-screen dialog
- New `CheckInScannerDialog.tsx` component opened from Guests page
- Full-screen dialog overlay (stays in context, no navigation)
- Contains: camera scanner, stats bar, result panel, recent scans list

### 4. Two-step scan → confirm flow
- **Step 1**: Scan QR → extract token from URL → call `verify-check-in` with `action: "verify"`
- **Step 2**: Show result card with guest info + "Confirm Check-In" button
- **Step 3**: On confirm → call `verify-check-in` with `action: "confirm"` → green success feedback
- Scanner stays active, result panel updates inline
- Three result states: valid (show confirm button), already checked-in (warning), invalid (error)

### 5. Manual search fallback
- Search input in scanner dialog — search by name or email
- Shows matching guests with manual "Check In" button
- Uses direct Supabase query (no edge function needed)

### 6. Check-in stats bar
- Inside scanner dialog: "12 / 45 checked in" progress indicator
- Updates in real-time after each confirmation

## Files

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `verify-check-in` with `verify_jwt = false` |
| `supabase/functions/verify-check-in/index.ts` | Fix double-read bug, add verify/confirm modes |
| `src/components/events/CheckInScannerDialog.tsx` | **New** — full-screen scanner dialog with two-step flow |
| `src/components/events/CheckedInTab.tsx` | **New** — Checked In tab content |
| `src/components/events/EventBuilderGuests.tsx` | Add Checked In tab, open scanner dialog instead of navigating |
| `src/pages/EventScanner.tsx` | Keep for backward compat, but redirect to manage page |

**6 files changed. 2 new components. 0 migrations.**

