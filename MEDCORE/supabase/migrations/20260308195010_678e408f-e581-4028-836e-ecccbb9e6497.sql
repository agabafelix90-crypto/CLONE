
-- SMS Credits table: per-facility balance
CREATE TABLE public.sms_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.sms_credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON public.sms_credits
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- SMS Credit Transactions: top-up and usage history
CREATE TABLE public.sms_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'topup', -- 'topup' or 'deduction'
  amount numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  reference_id text,
  description text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  momo_transaction_id text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.sms_credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can insert transactions" ON public.sms_credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update transactions" ON public.sms_credit_transactions
  FOR UPDATE TO authenticated
  USING (true);
