-- Migration: Add seller payout tracking to orders table
-- Run in Supabase SQL Editor

-- Add seller_payee_email to record who should receive the payout
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'seller_payee_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN seller_payee_email TEXT;
  END IF;
END $$;

-- Add payout_status to track whether the payout has been sent to the seller
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payout_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payout_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add payout_sent_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payout_sent_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payout_sent_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add payout_batch_id from PayPal Payouts API response
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payout_batch_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payout_batch_id TEXT;
  END IF;
END $$;

-- Index for admin payouts dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_flow_payout ON orders(checkout_flow, payout_status);
