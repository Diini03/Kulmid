-- Add host information columns to events table
ALTER TABLE public.events 
ADD COLUMN host_name text,
ADD COLUMN host_description text,
ADD COLUMN host_email text,
ADD COLUMN host_phone text;

-- Add comments for documentation
COMMENT ON COLUMN public.events.host_name IS 'Name of the organization or person hosting the event';
COMMENT ON COLUMN public.events.host_description IS 'Description about the host/organizer (optional)';
COMMENT ON COLUMN public.events.host_email IS 'Contact email for the host (optional)';
COMMENT ON COLUMN public.events.host_phone IS 'Contact phone number for the host (optional)';