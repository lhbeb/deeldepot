-- ============================================================
-- DeelDepot — Multi-Seller System Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  location    TEXT,
  member_since TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Add seller_id foreign key to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

-- 3. RLS: allow public read on sellers
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on sellers"
  ON sellers FOR SELECT
  USING (true);

CREATE POLICY "Allow service role all on sellers"
  ON sellers FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Index for faster lookup by username
CREATE INDEX IF NOT EXISTS sellers_username_idx ON sellers (username);
