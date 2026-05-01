-- Fix: Replace the partial unique index with a full unique constraint on provider.
-- The partial index (WHERE is_active = true) cannot be used by PostgreSQL for
-- ON CONFLICT / upsert operations, which caused "Failed to save configuration".

-- Step 1: Drop the old partial unique index
DROP INDEX IF EXISTS unique_active_stripe;

-- Step 2: Add a proper unique constraint on provider
-- This ensures only one row per provider (stripe, paypal-direct, etc.)
-- and enables upsert operations if ever needed in the future.
ALTER TABLE public.payment_settings
  DROP CONSTRAINT IF EXISTS payment_settings_provider_unique;

ALTER TABLE public.payment_settings
  ADD CONSTRAINT payment_settings_provider_unique UNIQUE (provider);
