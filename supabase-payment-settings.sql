-- SQL Migration to create payment_settings table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    publishable_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    mode VARCHAR(20) NOT NULL DEFAULT 'live',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Ensure only one active stripe setting at a time using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_stripe 
ON public.payment_settings (provider) 
WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Deny all access to public and authenticated users
-- Relying on service_role (supabaseAdmin) for backend operations
-- If we explicitly don't provide a policy, default is DENY.
-- We can add explicit secure policies just in case.

CREATE POLICY "Service role full access on payment_settings"
    ON public.payment_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Deny all public access on payment_settings"
    ON public.payment_settings
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all authenticated access on payment_settings"
    ON public.payment_settings
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_settings_updated_at ON public.payment_settings;

CREATE TRIGGER trg_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION update_payment_settings_updated_at();

-- Note: No seed data is inserted automatically to prevent accidental live key overwrites.
-- Configure it exclusively through the Admin Dashboard.
