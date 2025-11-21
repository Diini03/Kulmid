-- Drop the old status check constraint if it exists
ALTER TABLE public.event_guests DROP CONSTRAINT IF EXISTS event_guests_status_check;

-- Add new constraint with correct status values
ALTER TABLE public.event_guests 
ADD CONSTRAINT event_guests_status_check 
CHECK (status IN ('invited', 'pending', 'registered', 'rejected', 'cancelled'));