
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'daily',
  amount numeric NOT NULL DEFAULT 0,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'momo',
  momo_reference text,
  phone_number text,
  manual_transaction_id text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can insert subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (true);
