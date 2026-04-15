-- Chapter/Organization Requests Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chapter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  region TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chapter_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a request
CREATE POLICY "Anyone can create chapter requests" ON chapter_requests
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view requests (for admins)
CREATE POLICY "Admins can view chapter requests" ON chapter_requests
  FOR SELECT USING (true);