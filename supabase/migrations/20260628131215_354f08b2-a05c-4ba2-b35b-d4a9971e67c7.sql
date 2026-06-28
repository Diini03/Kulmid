
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status IN ('published','pending','draft')
);

DROP POLICY IF EXISTS "Public can view approved events" ON public.events;
CREATE POLICY "Public can view approved events"
ON public.events FOR SELECT
USING (status = ANY (ARRAY['published','featured','approved','upcoming','ongoing','past']));
