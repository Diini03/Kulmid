
-- Extend profiles table with new columns
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

-- Allow public to view public profiles
CREATE POLICY "Public can view public profiles" ON public.profiles FOR SELECT USING (is_public = true);

-- Create notification_settings table
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

CREATE POLICY "Users can view own notification settings" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
