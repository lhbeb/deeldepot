-- ============================================================
-- DeelDepot — Add Reviews Column to Sellers Table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add a JSONB column to store native seller reviews (added via Admin dashboard)
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;

-- Example of existing table modification
-- Allows the seller to have standalone reviews independent of product reviews
