-- Create a sequence starting at 9011 for order numbers
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 9011;

-- Add order_number column to orders using the sequence
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT nextval('orders_order_number_seq');

-- Ensure any manually inserted integers in the future don't break sequence
-- By using a general sequence, it avoids overlap on concurrent inserts
