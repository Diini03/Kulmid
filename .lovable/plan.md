

## Profile & Settings System for Kulmid

This is a large feature. I'll break it into two phases to keep changes manageable and avoid errors. **Phase 1** (this plan) covers the database migration, Profile page, and enhanced Settings page. Phase 2 (follow-up) can add activity feed, community impact charts, and social features.

---

### Database Migration

Extend the `profiles` table with new columns:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_hosted_events boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_attended_events boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_invitations boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_discovery boolean DEFAULT true;
```

Add a `notification_settings` table:

```sql
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  registration_confirmations boolean DEFAULT true,
  guest_alerts boolean DEFAULT true,
  event_reminders boolean DEFAULT true,
  invitation_emails boolean DEFAULT true,
  marketing_updates boolean DEFAULT false,
  platform_announcements boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
-- RLS: users manage their own
CREATE POLICY "Users can view own notification settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
```

Add public read policy for profiles (for public profile pages):

```sql
CREATE POLICY "Public can view public profiles" ON public.profiles FOR SELECT USING (is_public = true);
```

---

### New Files

**`src/pages/Profile.tsx`** — Public profile page at `/profile/:userId`
- Profile header: avatar, name, @username, bio, join date, social links, stats row
- Stats: Hosted Events count, Attended Events count, Total Guests Hosted (all queried from `events` + `event_guests`)
- Owner-only: Edit Profile / Settings / Create Event buttons
- Tabs: Hosted Events, Attended Events, Favorites, Activity
- Hosted Events tab: grid of EventCards with status badges
- Attended Events tab: events from `event_guests` where email matches user
- Favorites tab: reuse existing favorites data
- Activity tab: simple timeline from events + registrations (no new table needed — derive from existing data)

**`src/pages/Settings.tsx`** — Full rewrite with sidebar layout
- Sidebar sections: Profile, Account, Notifications, Privacy, Event Preferences, Appearance, Security
- Profile: avatar upload (to `event-images` bucket), full name, username, bio, location, website, social links
- Account: email (read-only), change password via Supabase auth
- Notifications: toggle switches for each notification type
- Privacy: toggles for public/private profile, show hosted/attended, allow invitations/discovery
- Event Preferences: reuse onboarding categories/topics/format as tag selectors, pull from `user_preferences`
- Appearance: light/dark/system theme selector (uses existing theme system)
- Security: change password, placeholder for 2FA

**`src/components/profile/ProfileHeader.tsx`** — Header section with avatar, name, stats
**`src/components/profile/ProfileTabs.tsx`** — Tab navigation + content
**`src/components/profile/ActivityTimeline.tsx`** — Derived activity feed
**`src/components/profile/CommunityImpact.tsx`** — Metric widgets
**`src/components/settings/SettingsSidebar.tsx`** — Settings navigation sidebar
**`src/components/settings/ProfileSettings.tsx`** — Profile form
**`src/components/settings/AccountSettings.tsx`** — Account management
**`src/components/settings/NotificationSettings.tsx`** — Notification toggles
**`src/components/settings/PrivacySettings.tsx`** — Privacy toggles
**`src/components/settings/PreferencesSettings.tsx`** — Event preferences
**`src/components/settings/AppearanceSettings.tsx`** — Theme selector
**`src/components/settings/SecuritySettings.tsx`** — Password change + placeholders

### Modified Files

- **`src/App.tsx`** — Add `/profile/:userId` route inside LayoutRoute
- **`src/contexts/AuthContext.tsx`** — Extend Profile interface with new fields
- **`src/components/layout/Navbar.tsx`** — Add "My Profile" link in user dropdown

### Design Approach

- All existing Kulmid design tokens (monochrome teal, `--primary`, `--surface-*`, `--shadow-*`)
- Existing UI components: Card, Badge, Tabs, Switch, Input, Button, Avatar
- Settings uses a responsive sidebar: vertical nav on desktop, horizontal tabs on mobile
- Profile header uses a subtle `bg-gradient-to-r from-primary/5 to-primary/10` overlay
- Stats displayed as small Card components in a row
- Event grid uses existing EventCard component
- No new colors or dependencies

