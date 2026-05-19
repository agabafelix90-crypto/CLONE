
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name text,
  recipient_phone text NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'manual',
  category text NOT NULL DEFAULT 'general',
  char_count integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  api_response jsonb,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sms logs" ON public.sms_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sms logs" ON public.sms_logs FOR UPDATE TO authenticated USING (true);
