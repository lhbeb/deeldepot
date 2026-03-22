-- Diagnostic Queries for Product Update Issue
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if the product exists
SELECT slug, title, checkout_flow, in_stock, is_featured
FROM products
WHERE slug = 'nikon-d850-45-7mp-dslr-camera-black-body-only-from-japan-very-good-condition';

-- 2. Check if checkout_flow column exists and its constraint
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'checkout_flow';

-- 3. Check the checkout_flow constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'products_checkout_flow_check';

-- 4. Check RLS policies on products table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'products';

-- 5. Try a simple update to test (change 'test-slug' to your actual slug)
-- This will help identify if it's an RLS issue
UPDATE products
SET checkout_flow = 'stripe'
WHERE slug = 'nikon-d850-45-7mp-dslr-camera-black-body-only-from-japan-very-good-condition'
RETURNING slug, checkout_flow;

-- 6. If the above fails, check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products';
