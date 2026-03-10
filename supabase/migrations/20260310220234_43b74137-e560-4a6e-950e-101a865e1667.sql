
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, actor_name)
  VALUES (
    NEW.user_id,
    'welcome',
    'Welcome to Kulmid! 🎉',
    'We''re glad to have you here. Start exploring events or create your own!',
    'Kulmid'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_notification();

CREATE OR REPLACE FUNCTION public.send_first_event_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.events WHERE created_by = NEW.created_by;
  IF event_count = 1 THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (
      NEW.created_by,
      'milestone',
      'Your first event is live! 🚀',
      'Congratulations on creating "' || NEW.title || '". Share it to get registrations!',
      NEW.id,
      'Kulmid'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created_notification
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.send_first_event_notification();

CREATE OR REPLACE FUNCTION public.send_registration_notification_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  event_owner uuid;
  event_title text;
BEGIN
  IF NEW.registration_type = 'registration' THEN
    SELECT created_by, title INTO event_owner, event_title
    FROM public.events WHERE id = NEW.event_id;
    
    IF event_owner IS NOT NULL THEN
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_guest_registered_notification
  AFTER INSERT ON public.event_guests
  FOR EACH ROW EXECUTE FUNCTION public.send_registration_notification_trigger();
