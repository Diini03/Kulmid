ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Mark existing preference rows as onboarding completed
UPDATE public.user_preferences SET onboarding_completed = true WHERE onboarding_completed = false;