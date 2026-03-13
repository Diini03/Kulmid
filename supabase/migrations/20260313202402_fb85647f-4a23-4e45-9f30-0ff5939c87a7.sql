CREATE POLICY "Anyone can view pending events via direct link"
ON public.events
FOR SELECT
TO public
USING (status = 'pending');