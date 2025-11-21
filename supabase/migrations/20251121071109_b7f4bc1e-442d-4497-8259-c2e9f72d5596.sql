-- Allow anyone to register for events by inserting into event_guests
CREATE POLICY "Anyone can register for events"
ON public.event_guests
FOR INSERT
TO public
WITH CHECK (registration_type = 'registration');