-- QUICK FIX: Add 'stripe' to checkout_flow constraint
-- Run this in your Supabase SQL Editor to fix the checkout_flow update issue

-- Step 1: Drop the old constraint (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_checkout_flow_check;
    RAISE NOTICE 'Dropped existing checkout_flow constraint';
  ELSE
    RAISE NOTICE 'No existing constraint found';
  END IF;
END $$;

-- Step 2: Add new constraint with 'stripe' included
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));

-- Step 3: Verify the constraint was created
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'products_checkout_flow_check';

-- Expected output:
-- constraint_name: products_checkout_flow_check
-- definition: CHECK ((checkout_flow = ANY (ARRAY['buymeacoffee'::text, 'kofi'::text, 'external'::text, 'stripe'::text])))

-- Success! You can now update products to use 'stripe' checkout flow
