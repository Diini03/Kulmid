ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free';

CREATE OR REPLACE FUNCTION public.validate_profile_plan_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_tier NOT IN ('free', 'pro', 'business') THEN
    RAISE EXCEPTION 'Invalid account plan';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_plan_tier_trigger ON public.profiles;
CREATE TRIGGER validate_profile_plan_tier_trigger
BEFORE INSERT OR UPDATE OF plan_tier ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_plan_tier();

CREATE OR REPLACE FUNCTION public.enforce_event_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limits jsonb;
  enforcement_enabled boolean;
  maximum integer;
  tier text;
  active_count integer;
BEGIN
  SELECT value INTO limits FROM public.platform_settings WHERE key = 'plan_limits';
  enforcement_enabled := COALESCE((limits ->> 'enforce')::boolean, false);

  IF NOT enforcement_enabled THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(plan_tier, 'free') INTO tier
  FROM public.profiles
  WHERE user_id = NEW.created_by;

  IF COALESCE(tier, 'free') <> 'free' THEN
    RETURN NEW;
  END IF;

  maximum := GREATEST(COALESCE((limits ->> 'free_active_events')::integer, 3), 0);
  SELECT count(*) INTO active_count
  FROM public.events
  WHERE created_by = NEW.created_by
    AND status NOT IN ('rejected', 'draft')
    AND COALESCE(end_date, date) >= now();

  IF active_count >= maximum THEN
    RAISE EXCEPTION 'Free plan active event limit reached (%).', maximum USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_event_plan_limit_trigger ON public.events;
CREATE TRIGGER enforce_event_plan_limit_trigger
BEFORE INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.enforce_event_plan_limit();

CREATE OR REPLACE FUNCTION public.enforce_registration_safeguards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limits jsonb;
  enforcement_enabled boolean;
  maximum integer;
  organizer_id uuid;
  tier text;
  registration_count integer;
  normalized_email text;
BEGIN
  IF NEW.registration_type IS DISTINCT FROM 'registration' THEN
    RETURN NEW;
  END IF;

  normalized_email := lower(trim(NEW.email));
  IF normalized_email = '' THEN
    RAISE EXCEPTION 'A valid email address is required.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.check_rate_limit(
    'event_registration_email',
    NEW.event_id || ':' || normalized_email,
    5,
    3600
  ) THEN
    RAISE EXCEPTION 'Too many registration attempts. Please try again later.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.check_rate_limit(
    'event_registration_event',
    NEW.event_id,
    60,
    60
  ) THEN
    RAISE EXCEPTION 'This event is receiving many registrations. Please try again shortly.' USING ERRCODE = 'P0001';
  END IF;

  SELECT value INTO limits FROM public.platform_settings WHERE key = 'plan_limits';
  enforcement_enabled := COALESCE((limits ->> 'enforce')::boolean, false);

  IF NOT enforcement_enabled THEN
    RETURN NEW;
  END IF;

  SELECT e.created_by INTO organizer_id FROM public.events e WHERE e.id = NEW.event_id;
  SELECT COALESCE(p.plan_tier, 'free') INTO tier FROM public.profiles p WHERE p.user_id = organizer_id;

  IF COALESCE(tier, 'free') <> 'free' THEN
    RETURN NEW;
  END IF;

  maximum := GREATEST(COALESCE((limits ->> 'free_registrations_per_event')::integer, 100), 0);
  SELECT count(*) INTO registration_count
  FROM public.event_guests
  WHERE event_id = NEW.event_id
    AND registration_type = 'registration'
    AND status <> 'cancelled';

  IF registration_count >= maximum THEN
    RAISE EXCEPTION 'This event has reached the free plan registration limit (%).', maximum USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_registration_safeguards_trigger ON public.event_guests;
CREATE TRIGGER enforce_registration_safeguards_trigger
BEFORE INSERT ON public.event_guests
FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_safeguards();

REVOKE ALL ON FUNCTION public.enforce_event_plan_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_registration_safeguards() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_event_plan_limit() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_registration_safeguards() TO service_role;