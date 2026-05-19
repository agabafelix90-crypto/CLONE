-- Editable clinical drug guidelines used by prescribing workflow

CREATE TABLE IF NOT EXISTS public.clinical_drug_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_key text NOT NULL,
  condition_label text NOT NULL,
  line_of_treatment text NOT NULL DEFAULT 'first_line',
  drug_name text NOT NULL,
  route text NOT NULL DEFAULT 'Oral',
  dosage text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT '',
  duration_value integer NOT NULL DEFAULT 1,
  duration_unit text NOT NULL DEFAULT 'Days',
  min_age integer,
  max_age integer,
  pregnancy_safe boolean DEFAULT true,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  updated_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_guidelines_condition_key
  ON public.clinical_drug_guidelines(condition_key);

CREATE INDEX IF NOT EXISTS idx_clinical_guidelines_condition_label
  ON public.clinical_drug_guidelines(condition_label);

CREATE INDEX IF NOT EXISTS idx_clinical_guidelines_drug_name
  ON public.clinical_drug_guidelines(drug_name);

ALTER TABLE public.clinical_drug_guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own guidelines" ON public.clinical_drug_guidelines;
DROP POLICY IF EXISTS "Users can insert own guidelines" ON public.clinical_drug_guidelines;
DROP POLICY IF EXISTS "Users can update own guidelines" ON public.clinical_drug_guidelines;
DROP POLICY IF EXISTS "Users can delete own guidelines" ON public.clinical_drug_guidelines;

CREATE POLICY "Users can view own guidelines"
  ON public.clinical_drug_guidelines
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own guidelines"
  ON public.clinical_drug_guidelines
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own guidelines"
  ON public.clinical_drug_guidelines
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own guidelines"
  ON public.clinical_drug_guidelines
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
