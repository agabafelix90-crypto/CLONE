
-- Billing items table for cashier/billing workflow
CREATE TABLE public.billing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  item_type TEXT NOT NULL DEFAULT 'lab_test',
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_id UUID,
  notes TEXT,
  billed_by UUID,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view billing items" ON public.billing_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert billing items" ON public.billing_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update billing items" ON public.billing_items
  FOR UPDATE TO authenticated USING (true);

-- Auto-create 2-day trial subscription for new users
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, amount, starts_at, expires_at, payment_status)
  VALUES (NEW.id, 'trial', 0, now(), now() + interval '2 days', 'completed');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();
