-- Divisions and Skill Levels RLS policies
-- Run this in Supabase SQL Editor

-- Allow view of divisions for seasons in coordinator's organizations
CREATE POLICY "Coordinators can view divisions"
ON divisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM seasons
    JOIN coordinators ON coordinators.organization_id = seasons.organization_id
    WHERE seasons.id = divisions.season_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Allow view of skill_levels for divisions in coordinator's organizations
CREATE POLICY "Coordinators can view skill_levels"
ON skill_levels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM divisions
    JOIN seasons ON seasons.id = divisions.season_id
    JOIN coordinators ON coordinators.organization_id = seasons.organization_id
    WHERE divisions.id = skill_levels.division_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Allow coordinators to manage divisions in their organizations
CREATE POLICY "Coordinators can insert divisions"
ON divisions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM seasons
    JOIN coordinators ON coordinators.organization_id = seasons.organization_id
    WHERE seasons.id = divisions.season_id
    AND coordinators.profile_id = auth.uid()
  )
);

CREATE POLICY "Coordinators can update divisions"
ON divisions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM seasons
    JOIN coordinators ON coordinators.organization_id = seasons.organization_id
    WHERE seasons.id = divisions.season_id
    AND coordinators.profile_id = auth.uid()
  )
);

-- Allow coordinators to manage skill_levels in their organizations
CREATE POLICY "Coordinators can insert skill_levels"
ON skill_levels
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM skill_levels sl
    JOIN divisions d ON d.id = sl.division_id
    JOIN seasons s ON s.id = d.season_id
    JOIN coordinators c ON c.organization_id = s.organization_id
    WHERE d.id = skill_levels.division_id
    AND c.profile_id = auth.uid()
  )
);

CREATE POLICY "Coordinators can update skill_levels"
ON skill_levels
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM skill_levels sl
    JOIN divisions d ON d.id = sl.division_id
    JOIN seasons s ON s.id = d.season_id
    JOIN coordinators c ON c.organization_id = s.organization_id
    WHERE d.id = skill_levels.division_id
    AND c.profile_id = auth.uid()
  )
);

-- Verify policies
SELECT polname, polcmd FROM pg_policy
JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE pg_class.relname IN ('divisions', 'skill_levels');