
-- Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_name text,
  appointment_date date NOT NULL,
  appointment_time time,
  reason text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reminder_sent boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (true);

-- Sales expenses table for tracking day/night expenses
CREATE TABLE public.sales_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  shift text NOT NULL DEFAULT 'day',
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view expenses" ON public.sales_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON public.sales_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.sales_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete expenses" ON public.sales_expenses FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
