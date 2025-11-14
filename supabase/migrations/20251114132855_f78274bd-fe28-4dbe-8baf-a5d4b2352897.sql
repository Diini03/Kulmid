-- Add 'draft' status to events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_status_check'
  ) THEN
    ALTER TABLE public.events 
    DROP CONSTRAINT IF EXISTS events_status_check;
    
    ALTER TABLE public.events 
    ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'pending', 'approved', 'upcoming', 'ongoing', 'past', 'rejected'));
  END IF;
END $$;

-- Create event_invitations table for tracking email invitations
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text NOT NULL,
  custom_title text,
  custom_message text,
  sent_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'opened')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, email)
);

-- Create event_guests table for managing guest list
CREATE TABLE IF NOT EXISTS public.event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'waitlist')),
  rsvp_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, email)
);

-- Enable RLS on new tables
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_invitations
CREATE POLICY "Users can view invitations for their own events"
ON public.event_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create invitations for their own events"
ON public.event_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all invitations"
ON public.event_invitations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for event_guests
CREATE POLICY "Users can view guests for their own events"
ON public.event_guests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_guests.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage guests for their own events"
ON public.event_guests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_guests.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all guests"
ON public.event_guests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policy for draft events visibility
CREATE POLICY "Users can view their own draft events"
ON public.events FOR SELECT
USING (
  (auth.uid() = created_by AND status = 'draft')
);

-- Add trigger for updated_at on event_guests
CREATE TRIGGER update_event_guests_updated_at
BEFORE UPDATE ON public.event_guests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();