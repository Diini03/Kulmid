-- Restore anon read access to events; visibility remains governed by the
-- existing "Public can view approved events" RLS policy.
GRANT SELECT ON public.events TO anon;