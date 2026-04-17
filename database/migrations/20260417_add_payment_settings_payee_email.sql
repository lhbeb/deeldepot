ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS payee_email text;

UPDATE public.payment_settings
SET payee_email = publishable_key
WHERE provider = 'paypal-unclaimed'
  AND (payee_email IS NULL OR payee_email = '')
  AND publishable_key IS NOT NULL
  AND publishable_key <> '';
