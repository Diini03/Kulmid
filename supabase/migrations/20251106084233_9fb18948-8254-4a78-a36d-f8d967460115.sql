-- Storage RLS policies for event-images bucket
-- Allow public read and authenticated uploads

-- 1) Public can view event images
CREATE POLICY "Public can view event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

-- 2) Authenticated users can upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- 3) Users can update their own event images (when using user-id folder structure)
CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4) Users can delete their own event images (when using user-id folder structure)
CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);