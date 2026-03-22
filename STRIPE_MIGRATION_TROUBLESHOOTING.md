# 🔧 Stripe Migration Troubleshooting

## ❌ Error: "relation 'products' does not exist"

This error means your Supabase database doesn't have the `products` table yet.

---

## ✅ Solution: Run Migrations in Order

You need to run the database migrations in the correct order:

### **Step 1: Create the Products Table** (if not already done)

Run this in your **Supabase SQL Editor**:

```sql
-- File: supabase-schema.sql
-- This creates the products table

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
  reviews JSONB DEFAULT '[]'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to modify" ON products
  FOR ALL USING (auth.role() = 'authenticated');
```

### **Step 2: Add checkout_flow Column** (if not already done)

Run this in your **Supabase SQL Editor**:

```sql
-- File: supabase-add-checkout-flow.sql
-- This adds the checkout_flow column with buymeacoffee, kofi, external

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'checkout_flow'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);

UPDATE products 
SET checkout_flow = 'buymeacoffee' 
WHERE checkout_flow IS NULL;
```

### **Step 3: Add Stripe to checkout_flow**

Now run the updated migration:

```sql
-- File: supabase-add-stripe-checkout-flow.sql
-- This adds 'stripe' to the existing checkout_flow options

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
```

---

## 🎯 Quick Check: Does Your Products Table Exist?

Run this query in Supabase SQL Editor to check:

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'products'
) AS table_exists;
```

**Result:**
- `true` = Table exists, you can skip Step 1
- `false` = Table doesn't exist, run Step 1 first

---

## 🔍 Check if checkout_flow Column Exists

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' AND column_name = 'checkout_flow'
) AS column_exists;
```

**Result:**
- `true` = Column exists, you can skip Step 2
- `false` = Column doesn't exist, run Step 2 first

---

## 📋 Summary

**Migration Order:**
1. ✅ Create `products` table → `supabase-schema.sql`
2. ✅ Add `checkout_flow` column → `supabase-add-checkout-flow.sql`
3. ✅ Add `stripe` option → `supabase-add-stripe-checkout-flow.sql` ⭐ **YOU ARE HERE**

---

## 💡 Alternative: All-in-One Migration

If you prefer, here's a single migration that does everything:

```sql
-- All-in-one migration: Create table + Add checkout_flow + Add stripe

-- Create products table if not exists
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
  checkout_flow TEXT DEFAULT 'buymeacoffee',  -- Added here
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

-- Add checkout_flow column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'checkout_flow'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_flow TEXT DEFAULT 'buymeacoffee';
  END IF;
END $$;

-- Drop existing constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_checkout_flow_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_checkout_flow_check;
  END IF;
END $$;

-- Add constraint with all flows including stripe
ALTER TABLE products 
ADD CONSTRAINT products_checkout_flow_check 
CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'products'
  ) THEN
    CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
  END IF;
END $$;
```

Copy and run this entire block in your Supabase SQL Editor!

---

**Need Help?** Let me know which step you're stuck on!
