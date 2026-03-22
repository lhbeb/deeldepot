-- Add collections column to products table
-- This allows products to be tagged with multiple collections (electronics, entertainment, hobbies, etc.)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS collections TEXT[] DEFAULT '{}';

-- Create index for faster collection lookups
CREATE INDEX IF NOT EXISTS idx_products_collections ON products USING GIN (collections);

-- Add comment
COMMENT ON COLUMN products.collections IS 'Array of collection tags (e.g., electronics, entertainment, hobbies-collectibles, featured)';

