-- Add 'stripe' to checkout_flow options
-- This extends the existing checkout flows without removing any
-- Existing flows: buymeacoffee, kofi, external
-- New flow: stripe

-- First, check if the products table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    RAISE EXCEPTION 'Table "products" does not exist. Please run the main schema migration first (supabase-schema.sql)';
  END IF;
END $$;

-- Add the checkout_flow column if it doesn't exist (for new installations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'checkout_flow'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
  END IF;
END $$;

-- Drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_checkout_flow_check;
  END IF;
END $$;

-- Add new constraint with stripe included
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));

-- Create index for faster filtering by checkout flow (if not exists)
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);

-- Note: No need to update existing products - they will keep their current checkout_flow values
-- New products will default to 'buymeacoffee' if not specified
