
-- Lab test templates (reusable test definitions)
CREATE TABLE public.lab_test_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  parameters JSONB DEFAULT '[]'::jsonb,
  normal_ranges TEXT,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_test_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.lab_test_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON public.lab_test_templates FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON public.lab_test_templates FOR UPDATE TO authenticated
  USING (true);

-- Lab test orders/results
CREATE TABLE public.lab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  test_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  result_data JSONB,
  normal_range TEXT,
  is_positive BOOLEAN DEFAULT false,
  ordered_by UUID,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lab tests"
  ON public.lab_tests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lab tests"
  ON public.lab_tests FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lab tests"
  ON public.lab_tests FOR UPDATE TO authenticated
  USING (true);
