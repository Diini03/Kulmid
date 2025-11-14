-- Fix search_path for validate_admin_email function
CREATE OR REPLACE FUNCTION public.validate_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Only allow diini@gmail.com to be admin
  IF NEW.role = 'admin' AND user_email != 'diini@gmail.com' THEN
    RAISE EXCEPTION 'Only diini@gmail.com can have admin role';
  END IF;
  
  -- Store email in user_roles for reference
  NEW.email := user_email;
  
  RETURN NEW;
END;
$$;