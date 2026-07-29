ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS registration_open_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS registration_close_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS allow_waitlist boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_override text;

-- backfill close date from the legacy deadline field
UPDATE public.events
SET registration_close_at = registration_deadline
WHERE registration_close_at IS NULL AND registration_deadline IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_event_registration_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.registration_open_at IS NOT NULL AND NEW.registration_close_at IS NOT NULL
     AND NEW.registration_close_at <= NEW.registration_open_at THEN
    RAISE EXCEPTION 'Registration close time must be after the open time';
  END IF;

  IF NEW.registration_open_at IS NOT NULL
     AND COALESCE(NEW.end_date, NEW.date) IS NOT NULL
     AND NEW.registration_open_at > COALESCE(NEW.end_date, NEW.date) THEN
    RAISE EXCEPTION 'Registration cannot open after the event has ended';
  END IF;

  IF NEW.registration_override IS NOT NULL
     AND NEW.registration_override NOT IN ('open','closed','cancelled') THEN
    RAISE EXCEPTION 'Invalid registration override value';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_event_registration_window_trg ON public.events;
CREATE TRIGGER validate_event_registration_window_trg
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_event_registration_window();

CREATE OR REPLACE FUNCTION public.get_event_registration_status(_event_id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e public.events%ROWTYPE;
  reg_count int;
BEGIN
  SELECT * INTO e FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF e.registration_override IS NOT NULL THEN
    RETURN e.registration_override;
  END IF;

  IF e.registration_open_at IS NOT NULL AND now() < e.registration_open_at THEN
    RETURN 'upcoming';
  END IF;

  IF e.registration_close_at IS NOT NULL AND now() > e.registration_close_at THEN
    RETURN 'closed';
  END IF;

  IF COALESCE(e.end_date, e.date) < now() THEN
    RETURN 'closed';
  END IF;

  IF e.max_attendees IS NOT NULL THEN
    SELECT public.get_event_registration_count(_event_id) INTO reg_count;
    IF reg_count >= e.max_attendees THEN
      RETURN 'full';
    END IF;
  END IF;

  RETURN 'open';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_registration_status(text) TO anon, authenticated, service_role;