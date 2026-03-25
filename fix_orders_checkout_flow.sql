-- DB Migration: Add checkout_flow to orders table
-- This persists the checkout flow that was active *at the time of the order*
-- so it doesn't change if the product's checkout flow is updated later.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_flow TEXT;

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'checkout_flow';
