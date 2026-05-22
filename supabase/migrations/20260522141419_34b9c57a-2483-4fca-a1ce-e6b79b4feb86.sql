
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'GraduationCap',
  color text NOT NULL DEFAULT 'from-teal-500 to-emerald-500',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (name, slug, icon, color, description, sort_order) VALUES
  ('Seminar', 'seminar', 'GraduationCap', 'from-blue-500 to-cyan-500', 'Educational talks and presentations', 0),
  ('Workshop', 'workshop', 'Wrench', 'from-purple-500 to-pink-500', 'Hands-on learning experiences', 1),
  ('Conference', 'conference', 'Users', 'from-teal-500 to-emerald-500', 'Professional networking events', 2),
  ('Festival', 'festival', 'Music', 'from-orange-500 to-red-500', 'Cultural celebrations and entertainment', 3),
  ('Webinar', 'webinar', 'Monitor', 'from-indigo-500 to-violet-500', 'Online educational sessions', 4),
  ('Meetup', 'meetup', 'Handshake', 'from-green-500 to-teal-500', 'Casual gatherings and community networking', 5);
