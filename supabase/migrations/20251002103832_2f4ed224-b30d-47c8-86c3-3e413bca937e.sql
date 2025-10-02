-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create events table
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Seminar', 'Workshop', 'Conference', 'Festival', 'Sports')),
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Everyone can view events"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update events"
  ON public.events
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete events"
  ON public.events
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- RLS policies for storage
CREATE POLICY "Anyone can view event images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update event images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'event-images' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete event images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-images' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Insert the 5 existing events from static data
INSERT INTO public.events (id, title, date, location, category, price, description) VALUES
  ('ev-001', 'Future of Tech Seminar', '2025-09-12T09:00:00Z', 'San Francisco, CA', 'Seminar', 49, 'Explore the latest technology trends and innovations shaping our future.'),
  ('ev-002', 'UX Design Workshop', '2025-08-30T10:00:00Z', 'Austin, TX', 'Workshop', 99, 'Hands-on workshop covering modern UX design principles and best practices.'),
  ('ev-003', 'Global Dev Conference', '2025-11-05T08:00:00Z', 'Berlin, DE', 'Conference', 399, 'The premier conference for developers worldwide featuring industry leaders.'),
  ('ev-004', 'Summer Lights Festival', '2025-07-22T18:00:00Z', 'Barcelona, ES', 'Festival', 59, 'A magical evening celebrating music, art, and culture under the summer sky.'),
  ('ev-005', 'Pro League Finals', '2025-10-03T17:00:00Z', 'New York, NY', 'Sports', 120, 'Watch the most exciting championship finals of the season live.');