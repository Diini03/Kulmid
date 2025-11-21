-- Add new columns to event_guests table
ALTER TABLE public.event_guests
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS degree TEXT,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS why_interested TEXT,
ADD COLUMN IF NOT EXISTS what_to_gain TEXT,
ADD COLUMN IF NOT EXISTS heard_from TEXT,
ADD COLUMN IF NOT EXISTS questions TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'registration';

-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS auto_approve_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on event registrations
CREATE INDEX IF NOT EXISTS idx_event_guests_event_id_status ON public.event_guests(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_guests_registration_type ON public.event_guests(registration_type);