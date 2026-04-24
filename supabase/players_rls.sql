-- Complete RLS policies for player access

-- Allow players to view seasons from their organization
DROP POLICY IF EXISTS "Players can view seasons from their organization" ON seasons;
CREATE POLICY "Players can view seasons from their organization"
ON seasons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.organization_id = seasons.organization_id
    AND players.profile_id = auth.uid()
  )
);

-- Allow players to view divisions from seasons in their organization
DROP POLICY IF EXISTS "Players can view divisions from their organization" ON divisions;
CREATE POLICY "Players can view divisions from their organization"
ON divisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM seasons
    JOIN players ON players.organization_id = seasons.organization_id
    WHERE seasons.id = divisions.season_id
    AND players.profile_id = auth.uid()
  )
);

-- Allow players to view skill_levels from divisions in their organization's seasons
DROP POLICY IF EXISTS "Players can view skill_levels from their organization" ON skill_levels;
CREATE POLICY "Players can view skill_levels from their organization"
ON skill_levels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM divisions
    JOIN seasons ON seasons.id = divisions.season_id
    JOIN players ON players.organization_id = seasons.organization_id
    WHERE divisions.id = skill_levels.division_id
    AND players.profile_id = auth.uid()
  )
);

-- Allow players to view organizations they're registered with
DROP POLICY IF EXISTS "Players can view their organizations" ON organizations;
CREATE POLICY "Players can view their organizations"
ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.organization_id = organizations.id
    AND players.profile_id = auth.uid()
  )
);

-- Verify policies
SELECT tablename, polname, polcmd FROM pg_policies
WHERE tablename IN ('seasons', 'divisions', 'skill_levels', 'organizations')
ORDER BY tablename;