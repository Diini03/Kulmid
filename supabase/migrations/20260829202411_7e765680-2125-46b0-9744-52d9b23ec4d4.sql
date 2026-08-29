-- 1. Event feedback
CREATE TABLE public.event_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.event_guests(id) ON DELETE SET NULL,
  rating integer NOT NULL,
  comment text,
  would_recommend boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX event_feedback_guest_unique ON public.event_feedback(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX event_feedback_event_idx ON public.event_feedback(event_id);

GRANT SELECT ON public.event_feedback TO authenticated;
GRANT ALL ON public.event_feedback TO service_role;

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view feedback for their events"
ON public.event_feedback FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_feedback.event_id AND e.created_by = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE OR REPLACE FUNCTION public.validate_event_feedback()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 2000 THEN
    RAISE EXCEPTION 'Comment is too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_feedback_trg
BEFORE INSERT OR UPDATE ON public.event_feedback
FOR EACH ROW EXECUTE FUNCTION public.validate_event_feedback();

-- 2. Organizer verification badge
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can update verification"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Rate limiting helper (table already exists, locked down to service role)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _identifier text,
  _max_count integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamptz := date_trunc('second', now()) - make_interval(secs => (extract(epoch from now())::bigint % _window_seconds));
  existing public.rate_limit_counters%ROWTYPE;
BEGIN
  SELECT * INTO existing
  FROM public.rate_limit_counters
  WHERE bucket = _bucket AND identifier = _identifier AND window_start = current_window
  FOR UPDATE;

  IF NOT FOUND THEN
    DELETE FROM public.rate_limit_counters
      WHERE bucket = _bucket AND identifier = _identifier;
    INSERT INTO public.rate_limit_counters (bucket, identifier, count, window_start)
      VALUES (_bucket, _identifier, 1, current_window);
    RETURN true;
  END IF;

  IF existing.count >= _max_count THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limit_counters SET count = count + 1 WHERE id = existing.id;
  RETURN true;
END;
$$;

-- 4. Plan limits (disabled by default so nothing changes until an admin turns it on)
INSERT INTO public.platform_settings (key, value)
VALUES ('plan_limits', '{"enforce": false, "free_active_events": 3, "free_registrations_per_event": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;