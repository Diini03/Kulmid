-- ============ 1. WAITLIST + CANCELLATION ON event_guests ============
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS waitlist_position integer,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_event_guests_cancel_token ON public.event_guests(cancel_token);
CREATE INDEX IF NOT EXISTS idx_event_guests_event_status ON public.event_guests(event_id, status);

-- Duplicate protection: one active registration per email per event
CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_guest_active_email
  ON public.event_guests (event_id, lower(email))
  WHERE status <> 'cancelled';

-- ============ 2. EVENT SLUGS ============
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.generate_event_slug(_title text, _event_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(COALESCE(_title, 'event'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'event'; END IF;
  base_slug := SUBSTRING(base_slug FROM 1 FOR 60);
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate AND id <> _event_id) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_event_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_event_slug ON public.events;
CREATE TRIGGER trg_assign_event_slug
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.assign_event_slug();

-- Backfill existing events
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, title FROM public.events WHERE slug IS NULL LOOP
    UPDATE public.events SET slug = public.generate_event_slug(r.title, r.id) WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_slug ON public.events(slug);

-- ============ 3. WAITLIST PROMOTION ============
CREATE OR REPLACE FUNCTION public.promote_event_waitlist(_event_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap int;
  active_count int;
  promoted int := 0;
  g record;
BEGIN
  SELECT max_attendees INTO cap FROM public.events WHERE id = _event_id;
  IF cap IS NULL THEN
    -- unlimited: promote everyone waiting
    FOR g IN SELECT id FROM public.event_guests
             WHERE event_id = _event_id AND status = 'waitlisted'
             ORDER BY waitlist_position NULLS LAST, created_at LOOP
      UPDATE public.event_guests
        SET status = 'registered', waitlist_position = NULL, promoted_at = now()
        WHERE id = g.id;
      promoted := promoted + 1;
    END LOOP;
    RETURN promoted;
  END IF;

  SELECT public.get_event_registration_count(_event_id) INTO active_count;

  FOR g IN SELECT id FROM public.event_guests
           WHERE event_id = _event_id AND status = 'waitlisted'
           ORDER BY waitlist_position NULLS LAST, created_at LOOP
    EXIT WHEN active_count >= cap;
    UPDATE public.event_guests
      SET status = 'registered', waitlist_position = NULL, promoted_at = now()
      WHERE id = g.id;
    active_count := active_count + 1;
    promoted := promoted + 1;
  END LOOP;

  RETURN promoted;
END;
$$;

-- Auto-promote whenever someone cancels / is removed
CREATE OR REPLACE FUNCTION public.auto_promote_on_free_spot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IN ('registered','approved') AND NEW.status = 'cancelled')
     OR TG_OP = 'DELETE' THEN
    PERFORM public.promote_event_waitlist(COALESCE(NEW.event_id, OLD.event_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_waitlist ON public.event_guests;
CREATE TRIGGER trg_auto_promote_waitlist
  AFTER UPDATE OR DELETE ON public.event_guests
  FOR EACH ROW EXECUTE FUNCTION public.auto_promote_on_free_spot();

-- Assign a waitlist position on insert when status = waitlisted
CREATE OR REPLACE FUNCTION public.assign_waitlist_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'waitlisted' AND NEW.waitlist_position IS NULL THEN
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO NEW.waitlist_position
    FROM public.event_guests WHERE event_id = NEW.event_id AND status = 'waitlisted';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_waitlist_position ON public.event_guests;
CREATE TRIGGER trg_assign_waitlist_position
  BEFORE INSERT ON public.event_guests
  FOR EACH ROW EXECUTE FUNCTION public.assign_waitlist_position();

-- ============ 4. EMAIL LOG (idempotency for reminders / bulk sends) ============
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  guest_id uuid,
  recipient text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_log_kind
  ON public.email_log (event_id, recipient, kind)
  WHERE kind IN ('reminder_24h','reminder_1h','post_event_summary');

GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view their event email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = email_log.event_id AND e.created_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============ 5. ADMIN AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can write audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- ============ 6. RATE LIMIT COUNTERS (server-side only) ============
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rate_limit ON public.rate_limit_counters(bucket, identifier);

GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
-- no policies: service_role only (bypasses RLS)

-- ============ 7. CROSS-EVENT ORGANIZER STATS ============
CREATE OR REPLACE FUNCTION public.get_organizer_aggregate_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_events', (SELECT count(*) FROM public.events WHERE created_by = _user_id),
    'total_registrations', (
      SELECT count(*) FROM public.event_guests g
      JOIN public.events e ON e.id = g.event_id
      WHERE e.created_by = _user_id AND g.status <> 'cancelled'
    ),
    'total_checked_in', (
      SELECT count(*) FROM public.event_guests g
      JOIN public.events e ON e.id = g.event_id
      WHERE e.created_by = _user_id AND g.checked_in = true
    ),
    'total_cancelled', (
      SELECT count(*) FROM public.event_guests g
      JOIN public.events e ON e.id = g.event_id
      WHERE e.created_by = _user_id AND g.status = 'cancelled'
    ),
    'total_waitlisted', (
      SELECT count(*) FROM public.event_guests g
      JOIN public.events e ON e.id = g.event_id
      WHERE e.created_by = _user_id AND g.status = 'waitlisted'
    )
  );
$$;