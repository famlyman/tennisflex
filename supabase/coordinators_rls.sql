-- Add RLS policy for coordinators table
-- Run this in your Supabase SQL Editor

-- Allow platform owners to insert coordinators
CREATE POLICY "Platform owners can insert coordinators" ON coordinators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_owner'
    )
  );

-- Allow anyone to view coordinators
CREATE POLICY "Anyone can view coordinators" ON coordinators
  FOR SELECT USING (true);