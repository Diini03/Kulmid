-- Add QR code check-in columns to event_guests table
ALTER TABLE public.event_guests
ADD COLUMN IF NOT EXISTS check_in_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_event_guests_check_in_token ON public.event_guests(check_in_token);

-- Create index for check-in queries
CREATE INDEX IF NOT EXISTS idx_event_guests_checked_in ON public.event_guests(event_id, checked_in);