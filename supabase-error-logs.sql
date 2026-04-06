-- Run this in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Error info
  type TEXT NOT NULL DEFAULT 'client',   -- 'client' | 'api' | 'server'
  message TEXT NOT NULL,
  stack TEXT,
  
  -- Context
  url TEXT,
  route TEXT,                            -- cleaned pathname e.g. /products/[slug]
  context TEXT,                          -- e.g. 'SellerBadge', 'checkout'
  
  -- User environment
  user_agent TEXT,
  
  -- Extra data (JSON blob for anything else)
  extra JSONB,
  
  -- Triage
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_note TEXT
);

-- Index for speed
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_resolved_idx ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS error_logs_type_idx ON error_logs(type);

-- Allow public insert (clients can write errors), but NOT read
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Only authenticated service role can read (your API uses service role key)
-- No SELECT policy for anon = anon can't read. Your server-side API can.
