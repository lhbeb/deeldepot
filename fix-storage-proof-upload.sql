-- Fix: Ensure the product-images storage bucket allows service_role uploads
-- and supports all MIME types used by the proof upload feature.

-- Step 1: Update allowed_mime_types to include image/gif
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
WHERE id = 'product-images';

-- Step 2: Add service_role INSERT policy (needed for server-side uploads via supabaseAdmin)
-- Drop first to avoid "already exists" errors
DROP POLICY IF EXISTS "Service role uploads for product images" ON storage.objects;

CREATE POLICY "Service role uploads for product images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'product-images');

-- Step 3: Add service_role UPDATE policy
DROP POLICY IF EXISTS "Service role updates for product images" ON storage.objects;

CREATE POLICY "Service role updates for product images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
