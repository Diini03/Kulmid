-- Create a table for user favorites
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_event_id ON public.user_favorites(event_id);