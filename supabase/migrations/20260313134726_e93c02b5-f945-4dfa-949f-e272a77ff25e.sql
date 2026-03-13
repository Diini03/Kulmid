ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes text;