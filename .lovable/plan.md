

## Fix: Update Admin Email Restriction

The `validate_admin_email()` function currently only allows `admin@kulmid.com`. Since you want `kulmid@gmail.com` to be admin, we need to update the trigger.

### Database Migration

Update the `validate_admin_email()` function to accept `kulmid@gmail.com`:

```sql
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
```

### Then Run Your Insert

After the migration, run:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'kulmid@gmail.com';
```

### Files Changed
- 1 database migration (update `validate_admin_email` function)
- No code file changes needed

