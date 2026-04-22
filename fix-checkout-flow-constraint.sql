-- Add 'paypal-unclaimed' back to the products checkout_flow constraint
-- (needed for backward compatibility with existing products)

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;

ALTER TABLE products ADD CONSTRAINT products_checkout_flow_check CHECK (
  checkout_flow IN (
    'buymeacoffee',
    'kofi',
    'external',
    'stripe',
    'paypal-invoice',
    'paypal-unclaimed',
    'paypal-direct',
    'lemon-squeezy'
  )
);
