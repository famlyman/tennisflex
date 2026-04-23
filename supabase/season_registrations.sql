-- Season Registration Tracking
-- Track which season/division each player registers for

-- Create season_registrations table
CREATE TABLE IF NOT EXISTS season_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  division_id uuid REFERENCES divisions(id),
  skill_level_id uuid REFERENCES skill_levels(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'completed')),
  registered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(player_id, season_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_season_registrations_player ON season_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_season_registrations_season ON season_registrations(season_id);

-- RLS Policies
ALTER TABLE season_registrations ENABLE ROW LEVEL SECURITY;

-- Players can view their own registrations
CREATE POLICY "Players can view own registrations" ON season_registrations
FOR SELECT USING (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()));

-- Coordinators can view registrations for their organization
CREATE POLICY "Coordinators can view org registrations" ON season_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM seasons s
    JOIN coordinators c ON c.organization_id = s.organization_id
    WHERE s.id = season_registrations.season_id
    AND c.profile_id = auth.uid()
  )
);

-- Coordinators can insert registrations for their organization
CREATE POLICY "Coordinators can insert registrations" ON season_registrations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM seasons s
    JOIN coordinators c ON c.organization_id = s.organization_id
    WHERE s.id = season_registrations.season_id
    AND c.profile_id = auth.uid()
  )
);

-- Admin can manage all
CREATE POLICY "Service role can manage all registrations" ON season_registrations
FOR ALL USING (auth.role() = 'service_role');

-- Verify
SELECT 'season_registrations table created' as status;