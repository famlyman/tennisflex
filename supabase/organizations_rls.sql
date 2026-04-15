-- Add RLS policy for platform owners to create organizations
-- Run this in your Supabase SQL Editor

-- Allow platform owners to insert organizations
CREATE POLICY "Platform owners can insert organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_owner'
    )
  );

-- Allow platform owners to update organizations  
CREATE POLICY "Platform owners can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_owner'
    )
  );

-- Allow platform owners to delete organizations
CREATE POLICY "Platform owners can delete organizations" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_owner'
    )
  );

-- Allow anyone to view active organizations
CREATE POLICY "Anyone can view active organizations" ON organizations
  FOR SELECT USING (true);