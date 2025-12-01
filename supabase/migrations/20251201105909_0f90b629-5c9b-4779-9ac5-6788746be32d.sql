-- Add RLS policy to allow users to delete their own events
CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);