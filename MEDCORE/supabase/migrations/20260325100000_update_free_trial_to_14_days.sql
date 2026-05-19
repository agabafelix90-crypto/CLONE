-- Update trial period from 2 days to 14 days for all existing and new trial subscriptions

-- Update runtime trigger function
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, amount, starts_at, expires_at, payment_status)
  VALUES (NEW.id, 'trial', 0, now(), now() + interval '14 days', 'completed');
  RETURN NEW;
END;
$$;

-- Update existing trial rows on all accounts to ensure at least 14-day window from start
UPDATE public.subscriptions
SET expires_at = starts_at + interval '14 days'
WHERE plan = 'trial'
  AND payment_status = 'completed'
  AND (expires_at IS NULL OR expires_at < starts_at + interval '14 days');

-- Also adjust old trigger to use the updated function
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();
