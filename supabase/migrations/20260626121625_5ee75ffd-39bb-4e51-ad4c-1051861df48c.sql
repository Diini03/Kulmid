
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check
  CHECK (status = ANY (ARRAY['draft','pending','approved','published','featured','upcoming','ongoing','past','rejected']));

UPDATE public.events SET status = 'published' WHERE status IN ('pending','draft','approved');

CREATE OR REPLACE FUNCTION public.notify_event_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  IF NEW.status IN ('published','approved') AND OLD.status NOT IN ('published','approved') THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (NEW.created_by,'event_published',
      'Your event "' || NEW.title || '" is live 🎉',
      'Share your event link to start getting registrations. Want it on Discover? Message Kulmid.',
      NEW.id,'Kulmid');
  ELSIF NEW.status = 'featured' AND OLD.status != 'featured' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (NEW.created_by,'event_featured',
      'Your event "' || NEW.title || '" is featured on Discover ⭐',
      'Kulmid promoted your event to the public Discover page.',
      NEW.id,'Kulmid');
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
    VALUES (NEW.created_by,'event_rejected',
      'Your event "' || NEW.title || '" was removed',
      CASE WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != ''
           THEN 'Reason: ' || NEW.rejection_reason
           ELSE 'Your event was removed by an admin.' END,
      NEW.id,'Kulmid');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_event_for_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _admin_record record; _creator_name text;
BEGIN
  IF NEW.status NOT IN ('published','pending') THEN RETURN NEW; END IF;
  SELECT p.full_name INTO _creator_name FROM public.profiles p WHERE p.user_id = NEW.created_by;
  FOR _admin_record IN SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin' LOOP
    IF _admin_record.user_id != NEW.created_by THEN
      INSERT INTO public.notifications (user_id, type, title, message, event_id, actor_name)
      VALUES (_admin_record.user_id,'admin_new_event',
        'New event published 📣',
        '"' || NEW.title || '" by ' || COALESCE(_creator_name,'a user') || '. Review and optionally feature on Discover.',
        NEW.id, COALESCE(_creator_name,'Unknown'));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_event_status()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.events SET status = 'past'
  WHERE date < now() - interval '24 hours' AND status NOT IN ('past','rejected');

  UPDATE public.events SET status = 'ongoing'
  WHERE date <= now() + interval '24 hours'
    AND date >= now() - interval '24 hours'
    AND status IN ('published','approved','upcoming','featured');
END;
$$;
