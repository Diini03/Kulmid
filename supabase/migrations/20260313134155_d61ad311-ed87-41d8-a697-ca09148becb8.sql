
-- ============================================================
-- Phase 1: Attach existing trigger functions (DROP IF EXISTS first)
-- ============================================================

-- Welcome notification on new profile
DROP TRIGGER IF EXISTS on_profile_created_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_notification();

-- First event milestone on new event
DROP TRIGGER IF EXISTS on_event_created_milestone ON public.events;
CREATE TRIGGER on_event_created_milestone
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.send_first_event_notification();

-- Registration notification for organizer on new guest
DROP TRIGGER IF EXISTS on_guest_registered_notify ON public.event_guests;
CREATE TRIGGER on_guest_registered_notify
  AFTER INSERT ON public.event_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.send_registration_notification_trigger();

-- ============================================================
-- Phase 2: New trigger functions for event lifecycle
-- ============================================================

-- 2A: Event status change → notify organizer (approved/rejected)
CREATE OR REPLACE FUNCTION public.notify_event_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _should_notify boolean := true;
BEGIN
  -- Only fire when status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      NEW.created_by,
      'event_approved',
      'Your event "' || NEW.title || '" has been approved ✅',
      'Your event is now visible on Kulmid Discover. Share it to get registrations!',
      NEW.id,
      'Kulmid'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      NEW.created_by,
      'event_rejected',
      'Your event "' || NEW.title || '" was not approved',
      CASE 
        WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' 
        THEN 'Reason: ' || NEW.rejection_reason
        ELSE 'Your event was not approved for Discover. You can edit and resubmit it.'
      END,
      NEW.id,
      'Kulmid'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_status_change ON public.events;
CREATE TRIGGER on_event_status_change
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_status_change();

-- 2B: Registration status change → notify attendee (if they have an account)
CREATE OR REPLACE FUNCTION public.notify_registration_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _attendee_user_id uuid;
  _event_title text;
  _should_notify boolean := true;
BEGIN
  -- Only fire when status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Find the user_id for this email (if they have an account)
  SELECT au.id INTO _attendee_user_id
  FROM auth.users au
  WHERE au.email = NEW.email
  LIMIT 1;

  -- If no account, we can't send in-app notification
  IF _attendee_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  SELECT COALESCE(ns.registration_confirmations, true) INTO _should_notify
  FROM public.notification_settings ns
  WHERE ns.user_id = _attendee_user_id;

  IF NOT _should_notify THEN
    RETURN NEW;
  END IF;

  -- Get event title
  SELECT e.title INTO _event_title
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF NEW.status = 'registered' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      _attendee_user_id,
      'registration_confirmed',
      'Registration confirmed for "' || COALESCE(_event_title, 'an event') || '" ✅',
      'You''re all set! Check your email for details.',
      NEW.event_id,
      'Kulmid'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      _attendee_user_id,
      'registration_rejected',
      'Registration update for "' || COALESCE(_event_title, 'an event') || '"',
      'Your registration was not approved by the organizer.',
      NEW.event_id,
      'Kulmid'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_registration_status_change ON public.event_guests;
CREATE TRIGGER on_registration_status_change
  AFTER UPDATE ON public.event_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_registration_status_change();

-- 2C: Guest check-in → notify event owner
CREATE OR REPLACE FUNCTION public.notify_guest_checked_in()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _event_owner uuid;
  _event_title text;
  _guest_name text;
  _should_notify boolean := true;
BEGIN
  -- Only fire when checked_in changes to true
  IF OLD.checked_in = true OR NEW.checked_in IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT e.created_by, e.title INTO _event_owner, _event_title
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF _event_owner IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  SELECT COALESCE(ns.guest_alerts, true) INTO _should_notify
  FROM public.notification_settings ns
  WHERE ns.user_id = _event_owner;

  IF NOT _should_notify THEN
    RETURN NEW;
  END IF;

  _guest_name := COALESCE(NEW.name, 'A guest');

  INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name, actor_email)
  VALUES (
    _event_owner,
    'check_in',
    _guest_name || ' checked in 📍',
    _guest_name || ' checked in at your event "' || COALESCE(_event_title, '') || '".',
    NEW.event_id,
    NEW.name,
    NEW.email
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_guest_checked_in ON public.event_guests;
CREATE TRIGGER on_guest_checked_in
  AFTER UPDATE ON public.event_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_guest_checked_in();

-- 2D: New pending event → notify all admins
CREATE OR REPLACE FUNCTION public.notify_new_event_for_admin()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _admin_record record;
  _creator_name text;
BEGIN
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get creator name
  SELECT p.full_name INTO _creator_name
  FROM public.profiles p
  WHERE p.user_id = NEW.created_by;

  -- Notify all admins
  FOR _admin_record IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  LOOP
    -- Don't notify the creator if they're an admin
    IF _admin_record.user_id != NEW.created_by THEN
      INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
      VALUES (
        _admin_record.user_id,
        'admin_new_event',
        'New event submitted for review 📋',
        '"' || NEW.title || '" by ' || COALESCE(_creator_name, 'a user') || ' is waiting for approval.',
        NEW.id,
        COALESCE(_creator_name, 'Unknown')
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_event_admin_notify ON public.events;
CREATE TRIGGER on_new_event_admin_notify
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_event_for_admin();

-- ============================================================
-- Phase 3: Update existing registration trigger to respect settings
-- ============================================================

CREATE OR REPLACE FUNCTION public.send_registration_notification_trigger()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  event_owner uuid;
  event_title text;
  _should_notify boolean := true;
BEGIN
  IF NEW.registration_type = 'registration' THEN
    SELECT created_by, title INTO event_owner, event_title
    FROM public.events WHERE id = NEW.event_id;
    
    IF event_owner IS NOT NULL THEN
      -- Check notification preferences
      SELECT COALESCE(ns.guest_alerts, true) INTO _should_notify
      FROM public.notification_settings ns
      WHERE ns.user_id = event_owner;

      IF _should_notify THEN
        INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name, actor_email)
        VALUES (
          event_owner,
          'registration',
          'New registration for "' || event_title || '"',
          COALESCE(NEW.name, 'Someone') || ' registered for your event.',
          NEW.event_id,
          NEW.name,
          NEW.email
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
