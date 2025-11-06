-- Delete any events without a creator
DELETE FROM public.events 
WHERE created_by IS NULL;

-- Make created_by NOT NULL
ALTER TABLE public.events 
ALTER COLUMN created_by SET NOT NULL;