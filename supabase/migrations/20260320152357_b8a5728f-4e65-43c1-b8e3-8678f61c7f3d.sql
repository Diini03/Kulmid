-- Table: event_registration_fields (built-in field config per event)
CREATE TABLE public.event_registration_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, field_key)
);

ALTER TABLE public.event_registration_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registration fields"
  ON public.event_registration_fields FOR SELECT
  TO public USING (true);

CREATE POLICY "Event owners can manage registration fields"
  ON public.event_registration_fields FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_registration_fields.event_id AND events.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_registration_fields.event_id AND events.created_by = auth.uid()));

CREATE POLICY "Admins can view all registration fields"
  ON public.event_registration_fields FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Table: event_registration_questions (custom questions)
CREATE TABLE public.event_registration_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'short_text',
  is_required boolean NOT NULL DEFAULT false,
  options jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registration_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
  ON public.event_registration_questions FOR SELECT
  TO public USING (is_active = true);

CREATE POLICY "Event owners can manage questions"
  ON public.event_registration_questions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_registration_questions.event_id AND events.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_registration_questions.event_id AND events.created_by = auth.uid()));

CREATE POLICY "Admins can view all questions"
  ON public.event_registration_questions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Table: event_registration_answers (attendee answers)
CREATE TABLE public.event_registration_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.event_guests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.event_registration_questions(id) ON DELETE CASCADE,
  answer_text text,
  answer_boolean boolean,
  answer_option text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registration_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert answers"
  ON public.event_registration_answers FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Event owners can view answers"
  ON public.event_registration_answers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_guests eg
    JOIN public.events e ON e.id = eg.event_id
    WHERE eg.id = event_registration_answers.registration_id AND e.created_by = auth.uid()
  ));

CREATE POLICY "Admins can view all answers"
  ON public.event_registration_answers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function + trigger to seed default fields on event creation
CREATE OR REPLACE FUNCTION public.initialize_event_registration_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.event_registration_fields (event_id, field_key, label, is_enabled, is_required, sort_order)
  VALUES
    (NEW.id, 'name', 'Full Name', true, true, 0),
    (NEW.id, 'email', 'Email', true, true, 1),
    (NEW.id, 'phone_number', 'Phone Number', true, true, 2),
    (NEW.id, 'organization', 'Organization', false, false, 3);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created_seed_registration_fields
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_event_registration_fields();

CREATE TRIGGER on_question_updated
  BEFORE UPDATE ON public.event_registration_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();