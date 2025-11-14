-- First, add email to user_roles table to enforce email-based admin restriction
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);

-- Function to validate admin email
CREATE OR REPLACE FUNCTION public.validate_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to validate admin email on insert/update
DROP TRIGGER IF EXISTS validate_admin_email_trigger ON public.user_roles;
CREATE TRIGGER validate_admin_email_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_email();

-- Remove any existing admin roles that aren't diini@gmail.com
DELETE FROM public.user_roles 
WHERE role = 'admin' 
AND user_id IN (
  SELECT id FROM auth.users WHERE email != 'diini@gmail.com'
);

-- Grant admin role to diini@gmail.com if exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user_id for diini@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'diini@gmail.com';
  
  -- If user exists, ensure they have admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, email)
    VALUES (admin_user_id, 'admin', 'diini@gmail.com')
    ON CONFLICT (user_id, role) 
    DO UPDATE SET email = 'diini@gmail.com';
  END IF;
END;
$$;