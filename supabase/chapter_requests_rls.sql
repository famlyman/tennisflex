-- Add RLS policies for chapter_requests table
-- Run this in your Supabase SQL Editor

-- Allow platform owners to update chapter_requests
CREATE POLICY "Platform owners can update chapter_requests" ON chapter_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_owner'
    )
  );

-- Allow anyone to view chapter_requests
CREATE POLICY "Anyone can view chapter_requests" ON chapter_requests
  FOR SELECT USING (true);