-- Harden permissive policies and bind data to authenticated users

-- Ensure ownership columns auto-populate
ALTER TABLE public.appointments ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE public.billing_items ALTER COLUMN billed_by SET DEFAULT auth.uid();
ALTER TABLE public.sms_logs ALTER COLUMN sent_by SET DEFAULT auth.uid();

ALTER TABLE public.sales_expenses
ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Subscriptions: owner/admin only
DROP POLICY IF EXISTS "Authenticated can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND payment_status NOT IN ('active','rejected')
  );

CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- SMS credits: read own/admin only from client
DROP POLICY IF EXISTS "Users can view own credits" ON public.sms_credits;
DROP POLICY IF EXISTS "Service role can manage credits" ON public.sms_credits;

CREATE POLICY "Users can view own credits" ON public.sms_credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- SMS credit transactions: read own/admin only
DROP POLICY IF EXISTS "Users can view own transactions" ON public.sms_credit_transactions;
DROP POLICY IF EXISTS "Authenticated can insert transactions" ON public.sms_credit_transactions;
DROP POLICY IF EXISTS "Authenticated can update transactions" ON public.sms_credit_transactions;

CREATE POLICY "Users can view own transactions" ON public.sms_credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- SMS logs: sender/admin visibility only
DROP POLICY IF EXISTS "Authenticated users can view sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Authenticated users can insert sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Authenticated users can update sms logs" ON public.sms_logs;

CREATE POLICY "Users can view own sms logs" ON public.sms_logs
  FOR SELECT TO authenticated
  USING (sent_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own sms logs" ON public.sms_logs
  FOR INSERT TO authenticated
  WITH CHECK (sent_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own sms logs" ON public.sms_logs
  FOR UPDATE TO authenticated
  USING (sent_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (sent_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Appointments: creator/admin only
DROP POLICY IF EXISTS "Authenticated can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can delete appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Billing items: biller/admin only
DROP POLICY IF EXISTS "Authenticated can view billing items" ON public.billing_items;
DROP POLICY IF EXISTS "Authenticated can insert billing items" ON public.billing_items;
DROP POLICY IF EXISTS "Authenticated can update billing items" ON public.billing_items;

CREATE POLICY "Users can view own billing items" ON public.billing_items
  FOR SELECT TO authenticated
  USING (billed_by = auth.uid() OR billed_by IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own billing items" ON public.billing_items
  FOR INSERT TO authenticated
  WITH CHECK (billed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own billing items" ON public.billing_items
  FOR UPDATE TO authenticated
  USING (billed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (billed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Sales expenses: owner/admin only
DROP POLICY IF EXISTS "Authenticated can view expenses" ON public.sales_expenses;
DROP POLICY IF EXISTS "Authenticated can insert expenses" ON public.sales_expenses;
DROP POLICY IF EXISTS "Authenticated can update expenses" ON public.sales_expenses;
DROP POLICY IF EXISTS "Authenticated can delete expenses" ON public.sales_expenses;

CREATE POLICY "Users can view own expenses" ON public.sales_expenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own expenses" ON public.sales_expenses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own expenses" ON public.sales_expenses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own expenses" ON public.sales_expenses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
