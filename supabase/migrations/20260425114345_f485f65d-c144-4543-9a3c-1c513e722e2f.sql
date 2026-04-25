-- Add username and social_links columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Ensure username is lowercase + unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

-- Helper: generate a username slug from a name
CREATE OR REPLACE FUNCTION public.generate_username_slug(_name text, _user_id uuid)
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
  -- Normalize: lowercase, replace non-alphanumerics with nothing, max 20 chars
  base_slug := LOWER(REGEXP_REPLACE(COALESCE(_name, 'user'), '[^a-zA-Z0-9]+', '', 'g'));
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'user';
  END IF;
  base_slug := SUBSTRING(base_slug FROM 1 FOR 20);

  candidate := base_slug;

  -- Append numeric suffix until unique
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = candidate
      AND user_id != _user_id
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$$;

-- Backfill usernames for existing rows
UPDATE public.profiles
SET username = public.generate_username_slug(full_name, user_id)
WHERE username IS NULL OR username = '';

-- Trigger: auto-assign username on insert if not provided
CREATE OR REPLACE FUNCTION public.assign_username_on_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := public.generate_username_slug(NEW.full_name, NEW.user_id);
  ELSE
    NEW.username := LOWER(NEW.username);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_username ON public.profiles;
CREATE TRIGGER profiles_assign_username
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_username_on_profile_insert();

-- Allow public lookup by username (read-only on safe fields via existing is_public policy)
-- Existing "Public can view public profiles" policy already handles this.

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);