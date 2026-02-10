-- Allow anyone to view pending events via direct link (shared by creator)
-- This enables the "share before admin approval" flow
CREATE POLICY "Anyone can view pending events by direct access"
ON public.events
FOR SELECT
USING (status = 'pending');
