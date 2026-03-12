-- Fix 1: Remove overly permissive notifications INSERT policy
-- Service role bypasses RLS, so this policy only opens the door to abuse
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Fix 2: Restrict attendance_stats INSERT to event owners only
DROP POLICY IF EXISTS "System can insert attendance stats" ON public.attendance_stats;

CREATE POLICY "Event owners can insert attendance stats"
ON public.attendance_stats
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = attendance_stats.event_id
    AND events.created_by = auth.uid()
  )
);