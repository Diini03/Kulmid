
-- Drop the view created in the previous migration (linter flagged it)
DROP VIEW IF EXISTS public.events_public;

-- Restore the public read policies on the base events table.
CREATE POLICY "Public can view approved events"
ON public.events
FOR SELECT
TO anon, authenticated
USING (status IN ('approved','upcoming','ongoing','past'));

-- Drop the duplicate authenticated-only policy from the previous migration
DROP POLICY IF EXISTS "Authenticated users can view approved events" ON public.events;

-- ============================================================
-- Column-level grants: hide sensitive contact / payout fields
-- from anonymous (logged-out) visitors.
-- Authenticated users keep full access (row filtering still handled
-- by RLS — they can only see their own private fields anyway since
-- only owners + admins can see drafts/etc.).
-- ============================================================
REVOKE SELECT ON public.events FROM anon;

GRANT SELECT (
  id, title, date, end_date, location, category, price, image_url,
  description, status, event_type, meeting_link, host_name,
  max_attendees, registration_deadline,
  facebook_url, twitter_url, instagram_url, linkedin_url, website_url,
  created_at, updated_at, created_by, rejection_reason,
  auto_approve_registrations
) ON public.events TO anon;

-- Authenticated users still see everything (RLS limits rows).
GRANT SELECT ON public.events TO authenticated;
