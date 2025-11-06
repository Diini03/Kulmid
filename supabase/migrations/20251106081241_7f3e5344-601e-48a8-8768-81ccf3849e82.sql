-- Add 'organizer' role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'organizer';

-- Add new fields to events table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN ('in-person', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update status field to support new values (pending, approved, rejected)
-- Note: 'upcoming', 'ongoing', 'past' already exist
COMMENT ON COLUMN public.events.status IS 'Event status: pending (awaiting approval), approved (live), rejected (not approved), upcoming (future approved event), ongoing (happening now), past (completed)';

-- Update RLS policies for events table

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
DROP POLICY IF EXISTS "Only admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Only admins can update events" ON public.events;
DROP POLICY IF EXISTS "Only admins can delete events" ON public.events;

-- New policy: Public can only view approved events
CREATE POLICY "Public can view approved events" 
ON public.events 
FOR SELECT 
USING (status IN ('approved', 'upcoming', 'ongoing', 'past'));

-- New policy: Authenticated users can view their own events
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = created_by);

-- New policy: Authenticated users can create events (status defaults to 'pending')
CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND status = 'pending'
);

-- New policy: Users can update their own pending events
CREATE POLICY "Users can update their own pending events" 
ON public.events 
FOR UPDATE 
USING (
  auth.uid() = created_by 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = created_by 
  AND status = 'pending'
);

-- New policy: Admins can view all events
CREATE POLICY "Admins can view all events" 
ON public.events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- New policy: Admins can update any event
CREATE POLICY "Admins can update any event" 
ON public.events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- New policy: Admins can delete any event
CREATE POLICY "Admins can delete any event" 
ON public.events 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- New policy: Admins can insert events (bypass pending status)
CREATE POLICY "Admins can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));