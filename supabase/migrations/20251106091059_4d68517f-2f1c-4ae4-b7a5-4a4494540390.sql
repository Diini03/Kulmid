-- Drop the old status check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the updated constraint with all valid status values
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'upcoming'::text, 'ongoing'::text, 'past'::text]));