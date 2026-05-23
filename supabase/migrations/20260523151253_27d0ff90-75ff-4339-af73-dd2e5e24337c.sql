
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. Create a sanitized public view of events that excludes sensitive
--    host PII (email, phone, payout phone, host description) and
--    runs as the view owner so anon callers can read it without
--    needing a broad SELECT policy on the base table.
CREATE OR REPLACE VIEW public.events_public
WITH (security_invoker = off) AS
SELECT
  id, title, date, end_date, location, category, price, image_url,
  description, status, event_type, meeting_link, host_name,
  max_attendees, registration_deadline,
  facebook_url, twitter_url, instagram_url, linkedin_url, website_url,
  created_at, updated_at, created_by
FROM public.events
WHERE status IN ('approved','upcoming','ongoing','past','pending');

GRANT SELECT ON public.events_public TO anon, authenticated;

-- 2. Remove the overly broad public SELECT policies on the base
--    events table. Authenticated owners and admins still have their
--    own policies; anonymous public access now goes through the view.
DROP POLICY IF EXISTS "Public can view approved events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view pending events via direct link" ON public.events;

-- Allow authenticated users to read approved/ongoing/past events on the
-- base table too (for logged-in flows that still need the full row e.g.
-- the event builder). Sensitive PII is only sent to authenticated callers.
CREATE POLICY "Authenticated users can view approved events"
ON public.events
FOR SELECT
TO authenticated
USING (status IN ('approved','upcoming','ongoing','past'));

-- 3. Tighten event_registration_answers INSERT: require the
--    registration_id to actually exist in event_guests, instead of
--    accepting any UUID from any client.
DROP POLICY IF EXISTS "Anyone can insert answers" ON public.event_registration_answers;
CREATE POLICY "Answers must reference an existing registration"
ON public.event_registration_answers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_guests g
    WHERE g.id = event_registration_answers.registration_id
      AND g.created_at > now() - interval '1 hour'
  )
);

-- 4. Revoke EXECUTE on internal trigger / helper SECURITY DEFINER
--    functions from anon and authenticated. Triggers still fire
--    because they run as the table owner regardless of grants.
REVOKE EXECUTE ON FUNCTION public.update_event_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_welcome_notification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_first_event_notification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_event_registration_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_admin_email() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_event_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_registration_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_guest_checked_in() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_event_for_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_registration_notification_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_username_slug(text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_username_on_profile_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Keep has_role + get_event_registration_count callable (used by RLS / frontend RPC).

-- 5. Lock down storage object listing for public buckets.
--    Files can still be fetched by direct URL — but anon can no longer
--    enumerate the contents of event-images / avatars.
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read event images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;

-- Note: public buckets in Supabase serve files directly through the
-- storage CDN regardless of these policies. Removing broad SELECT
-- policies prevents API-level LIST/enumerate without breaking <img src>.
