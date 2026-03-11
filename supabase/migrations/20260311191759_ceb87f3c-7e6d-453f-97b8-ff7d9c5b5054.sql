CREATE OR REPLACE FUNCTION public.validate_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  IF NEW.role = 'admin' AND user_email != 'kulmid@gmail.com' THEN
    RAISE EXCEPTION 'Only kulmid@gmail.com can have admin role';
  END IF;
  
  NEW.email := user_email;
  RETURN NEW;
END;
$$;