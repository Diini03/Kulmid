-- Create attendance_stats table for tracking predictions vs actuals
CREATE TABLE IF NOT EXISTS public.attendance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_registrations INTEGER NOT NULL,
  total_checked_in INTEGER NOT NULL DEFAULT 0,
  predicted_attendance INTEGER,
  predicted_rate NUMERIC(5,2),
  actual_rate NUMERIC(5,2),
  confidence TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all attendance stats"
  ON public.attendance_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Event creators can view their event stats"
  ON public.attendance_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = attendance_stats.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert attendance stats"
  ON public.attendance_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_attendance_stats_event_id ON public.attendance_stats(event_id);
CREATE INDEX idx_attendance_stats_calculated_at ON public.attendance_stats(calculated_at DESC);