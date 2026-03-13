ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'registration',
  'invitation',
  'welcome',
  'milestone',
  'event_approved',
  'event_rejected',
  'registration_confirmed',
  'registration_rejected',
  'check_in',
  'admin_new_event',
  'reminder',
  'update',
  'system'
]));