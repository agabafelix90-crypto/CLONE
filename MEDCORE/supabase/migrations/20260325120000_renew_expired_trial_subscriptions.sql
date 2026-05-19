-- Renew all existing expired trial subscriptions to 30 days from now
UPDATE public.subscriptions
SET starts_at = now(),
    expires_at = now() + interval '30 days',
    payment_status = 'completed'
WHERE plan = 'trial'
  AND payment_status = 'completed'
  AND expires_at < now();

-- Add guard to keep existing trial logic consistent for new expired trials in backend
-- (if needed, every refresh of use-subscription can refresh at app layer as above)
