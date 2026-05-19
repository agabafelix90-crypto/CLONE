
-- Add missing columns for triage and clinical workflow
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS symptoms TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nok_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nok_relationship TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nok_contact TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS admitted_date DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ;

-- Add notes column to vitals
ALTER TABLE public.vitals ADD COLUMN IF NOT EXISTS notes TEXT;
