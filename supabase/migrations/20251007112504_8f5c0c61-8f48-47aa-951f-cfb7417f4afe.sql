-- Add status column to events table
ALTER TABLE public.events 
ADD COLUMN status text NOT NULL DEFAULT 'upcoming' 
CHECK (status IN ('upcoming', 'ongoing', 'past'));

-- Create a function to automatically update event status based on date
CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update events to 'past' if their date has passed
  UPDATE public.events
  SET status = 'past'
  WHERE date < now() AND status != 'past';
  
  -- Update events to 'ongoing' if they're happening now (within 24 hours)
  UPDATE public.events
  SET status = 'ongoing'
  WHERE date <= now() + interval '24 hours' 
    AND date >= now() 
    AND status = 'upcoming';
END;
$$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);