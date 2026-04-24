-- Seasons RLS policies
-- Run this in Supabase SQL Editor

-- Allow coordinators to view seasons in their organizations
CREATE POLICY "Coordinators can view seasons in their organization"
ON seasons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coordinators
    WHERE coordinators.organization_id = seasons.organization_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Allow coordinators to update seasons in their organizations
CREATE POLICY "Coordinators can update seasons in their organization"
ON seasons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM coordinators
    WHERE coordinators.organization_id = seasons.organization_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Allow coordinators to insert seasons in their organizations
CREATE POLICY "Coordinators can insert seasons in their organization"
ON seasons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coordinators
    WHERE coordinators.organization_id = seasons.organization_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Verify policies were created
SELECT polname, polcmd FROM pg_policy
JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE pg_class.relname = 'seasons';