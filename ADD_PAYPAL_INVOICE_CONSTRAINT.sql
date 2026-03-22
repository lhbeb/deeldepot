-- Add 'paypal-invoice' to the checkout_flow CHECK constraint
-- Run this in your Supabase SQL Editor → SQL tab

-- Step 1: Drop the existing constraint
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_checkout_flow_check;

-- Step 2: Recreate it with 'paypal-invoice' included
ALTER TABLE products
ADD CONSTRAINT products_checkout_flow_check
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe', 'paypal-invoice'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'products_checkout_flow_check';
