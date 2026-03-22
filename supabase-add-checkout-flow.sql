-- Add checkout_flow column to products table
-- This allows each product to have its own checkout method (buymeacoffee, kofi, external)

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'checkout_flow'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
  END IF;
END $$;

-- Add a check constraint to ensure valid checkout flow values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_checkout_flow_check 
    CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external'));
  END IF;
END $$;

-- Create index for faster filtering by checkout flow
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);

-- Update existing products to use 'buymeacoffee' as default (if they don't have a value)
UPDATE products 
SET checkout_flow = 'buymeacoffee' 
WHERE checkout_flow IS NULL;
