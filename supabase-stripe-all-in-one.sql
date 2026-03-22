-- ============================================
-- ALL-IN-ONE MIGRATION: Add Stripe Checkout Flow
-- ============================================
-- This migration safely adds 'stripe' to checkout_flow options
-- It works whether you have an existing products table or not
-- Safe to run multiple times (idempotent)

-- Step 1: Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  images TEXT[] NOT NULL,
  condition TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  payee_email TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  checkout_link TEXT NOT NULL,
  checkout_flow TEXT DEFAULT 'buymeacoffee',
  reviews JSONB DEFAULT '[]'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT FALSE,
  listed_by TEXT,
  collections TEXT[],
  original_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add checkout_flow column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'checkout_flow'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
    RAISE NOTICE 'Added checkout_flow column to products table';
  ELSE
    RAISE NOTICE 'checkout_flow column already exists';
  END IF;
END $$;

-- Step 3: Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_checkout_flow_check;
    RAISE NOTICE 'Dropped existing checkout_flow constraint';
  ELSE
    RAISE NOTICE 'No existing constraint to drop';
  END IF;
END $$;

-- Step 4: Add new constraint with all flows including stripe
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- Step 6: Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies (if they don't exist)
DO $$
BEGIN
  -- Allow public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow public read access' AND tablename = 'products'
  ) THEN
    CREATE POLICY "Allow public read access" ON products 
    FOR SELECT USING (true);
    RAISE NOTICE 'Created public read policy';
  END IF;

  -- Allow authenticated users to modify
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow authenticated users to modify' AND tablename = 'products'
  ) THEN
    CREATE POLICY "Allow authenticated users to modify" ON products 
    FOR ALL USING (auth.role() = 'authenticated');
    RAISE NOTICE 'Created authenticated modify policy';
  END IF;
END $$;

-- Step 8: Update any NULL checkout_flow values to default
UPDATE products 
SET checkout_flow = 'buymeacoffee' 
WHERE checkout_flow IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! Stripe checkout flow is now available.';
  RAISE NOTICE 'Valid checkout flows: buymeacoffee, kofi, external, stripe';
END $$;
