CREATE TABLE public.early_access_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  events_per_month TEXT,
  source TEXT DEFAULT 'pricing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.early_access_leads TO anon;
GRANT INSERT ON public.early_access_leads TO authenticated;
GRANT ALL ON public.early_access_leads TO service_role;

ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an early-access lead (insert only)
CREATE POLICY "Anyone can submit early access lead"
ON public.early_access_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admins can view leads"
ON public.early_access_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_early_access_leads_email ON public.early_access_leads(email);
CREATE INDEX idx_early_access_leads_created_at ON public.early_access_leads(created_at DESC);