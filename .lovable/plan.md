

# Professional Notification System for Kulmid

## Current State

Kulmid already has:
- **Notifications table** with RLS (users can read/update/delete own, but **cannot INSERT** — only SECURITY DEFINER functions can)
- **3 trigger functions** defined: `send_welcome_notification`, `send_first_event_notification`, `send_registration_notification_trigger`
- **NotificationsContext** with real-time subscription (filtered by user_id)
- **NotificationsPanel** UI with icons for `registration`, `invitation`, `welcome`, `milestone` types
- **EmailJS** for 2 email templates (invitation + registration confirmed)

**Problem**: The trigger functions exist but the knowledge base says "There are no triggers in the database" — meaning the functions are defined but **may not be attached as triggers**. This needs verification and fixing.

## What Will Be Implemented

### Phase 1: Database — New Trigger Functions + Attach All Triggers

Create a single migration that:

1. **Attaches existing trigger functions** (if not already attached):
   - `send_welcome_notification` → `AFTER INSERT ON profiles`
   - `send_first_event_notification` → `AFTER INSERT ON events`
   - `send_registration_notification_trigger` → `AFTER INSERT ON event_guests`

2. **Creates new trigger functions** for event lifecycle:

   - **`notify_event_status_change()`** — `AFTER UPDATE ON events`
     - When `status` changes to `approved` → insert notification for `created_by`:
       *Type*: `event_approved`, *Title*: `Your event "{title}" has been approved`, *Message*: `Your event is now visible on Kulmid Discover.`
     - When `status` changes to `rejected` → insert notification for `created_by`:
       *Type*: `event_rejected`, *Title*: `Your event "{title}" was not approved`, *Message*: `Reason: {rejection_reason}` or fallback text
     - Only fires when `OLD.status != NEW.status`

   - **`notify_registration_status_change()`** — `AFTER UPDATE ON event_guests`
     - When guest `status` changes to `registered` (approved) and the guest email matches a profile → insert notification for that user:
       *Type*: `registration_confirmed`, *Title*: `Registration confirmed for "{event_title}"`, *Message*: `You're all set! Check your email for details.`
     - When guest `status` changes to `rejected` and email matches a profile → insert notification:
       *Type*: `registration_rejected`, *Title*: `Registration update for "{event_title}"`, *Message*: `Your registration was not approved by the organizer.`

   - **`notify_guest_checked_in()`** — `AFTER UPDATE ON event_guests`
     - When `checked_in` changes from `false` to `true` → insert notification for event owner:
       *Type*: `check_in`, *Title*: `{guest_name} checked in`, *Message*: `{guest_name} checked in at your event "{event_title}".`

   - **`notify_new_event_for_admin()`** — `AFTER INSERT ON events`
     - When a new event is created with `status = 'pending'` → insert notification for all admin users:
       *Type*: `admin_new_event`, *Title*: `New event submitted for review`, *Message*: `"{title}" by {creator_name} is waiting for approval.`

3. **Notification grouping** — For the "3 new registrations" pattern:
   - Not implemented as a trigger (too complex for DB-level). Instead, the frontend NotificationsPanel will group consecutive same-type notifications for the same event within a time window.

### Phase 2: Frontend — Enhanced NotificationsPanel

Update the notification panel to:

1. **Add icons** for new notification types:
   - `event_approved` → CheckCircle (green)
   - `event_rejected` → XCircle (red)
   - `registration_confirmed` → Ticket (green)
   - `registration_rejected` → XCircle (red)
   - `check_in` → ScanLine (teal)
   - `admin_new_event` → ShieldCheck (orange)

2. **Group consecutive notifications** of same type + same event_id within 10 minutes:
   - Display as: "3 new registrations for your event" instead of 3 separate items
   - Show expandable detail on click

3. **Make notifications actionable** — clicking a notification with an `event_id` navigates to that event

### Phase 3: Notification Settings Integration

The `notification_settings` table already exists with toggles for `registration_confirmations`, `guest_alerts`, `event_reminders`, `invitation_emails`. 

Update the trigger functions to **check notification_settings** before inserting:
- `guest_alerts` → controls `registration` type notifications for organizers
- `registration_confirmations` → controls `registration_confirmed` for attendees
- This is done inside the SECURITY DEFINER functions by querying `notification_settings`

## What Cannot Be Fully Solved

| Item | Reason |
|------|--------|
| **Event reminders** (24h / 1h before) | Requires `pg_cron` extension — available on Supabase free plan but needs manual SQL setup via Supabase Dashboard. Will provide the SQL but cannot execute scheduled jobs automatically. |
| **Notifications for anonymous registrants** | Guests who register without an account have no `user_id` — in-app notifications cannot reach them. Only email (EmailJS) can. |
| **Email notifications for all types** | EmailJS free tier is limited to 2 templates. Additional email notifications would require upgrading EmailJS or switching to a server-side email service. |
| **Push notifications** | Requires service worker + push subscription infrastructure — out of scope for this phase. |
| **Weekly digest emails** | Requires scheduled edge function + email service — can be added later. |

## Implementation Summary

| Phase | Changes | Files |
|-------|---------|-------|
| 1: Database triggers | 4 new trigger functions, attach all triggers | 1 migration |
| 2: Frontend UI | Enhanced panel with icons, grouping, navigation | `NotificationsPanel.tsx` |
| 3: Settings integration | Check preferences before inserting | Update trigger functions |

**Total: 1 migration + 2 files modified.**

