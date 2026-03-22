-- ============================================
-- FIX: Product Update RLS Policy Issue
-- ============================================
-- This fixes the "Product update failed" error by ensuring
-- the service role (used by admin) can update products

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to modify" ON products;
DROP POLICY IF EXISTS "Allow service role full access" ON products;

-- Step 2: Create a permissive policy for service_role
-- This allows the admin API (which uses service_role) to update products
CREATE POLICY "Enable all access for service_role" ON products
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 3: Create a policy for authenticated users (optional)
-- Uncomment if you want authenticated users to be able to update products
-- CREATE POLICY "Enable updates for authenticated users" ON products
-- AS PERMISSIVE
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Step 4: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE 'The service_role (admin) can now update products.';
END $$;
