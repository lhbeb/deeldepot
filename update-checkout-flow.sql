-- 1. First drop the old constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;

-- 2. Then update all existing rows (so they don't trigger any constraint violations)
UPDATE products SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';
UPDATE orders SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';

-- 3. Finally, add the new constraint back
ALTER TABLE products ADD CONSTRAINT products_checkout_flow_check CHECK (checkout_flow IN ('buymeacoffee', 'kofi', 'external', 'stripe', 'paypal-invoice', 'paypal-direct', 'lemon-squeezy'));
