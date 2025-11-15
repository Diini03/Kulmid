-- Add 'rejected' as a valid status for events
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'upcoming', 'ongoing', 'past', 'rejected'));

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);