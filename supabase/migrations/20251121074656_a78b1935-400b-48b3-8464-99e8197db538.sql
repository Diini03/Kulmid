-- Drop the restrictive pending-only update policy
DROP POLICY IF EXISTS "Users can update their own pending events" ON public.events;

-- Create a new policy that allows users to update their own events regardless of status
-- (draft, pending, or even approved - as long as they own it)
CREATE POLICY "Users can update their own events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Also ensure users can update status to pending when submitting for review
-- This is already covered by the above policy since we removed the status restriction