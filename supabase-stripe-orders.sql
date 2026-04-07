-- Add Stripe tracking columns and order status to the `orders` table

-- 1. Status Column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_payment';

-- 2. Payment Provider
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_provider text;

-- 3. Stripe Checkout Session ID (with Unique constraint for robust webhooks)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- Add unique constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_stripe_checkout_session_id_key') THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);
    END IF;
END
$$;

-- 4. Payment Intent and Status
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_payment_status text;

-- 5. Timestamps & Expiration
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_last_error text;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS checkout_expires_at timestamp with time zone;
