-- Players RLS policies

-- Allow players to view seasons from their organization
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

-- Allow players to view divisions from their organization's seasons
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

-- Allow players to view skill_levels from their organization's seasons
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