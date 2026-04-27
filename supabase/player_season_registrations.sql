-- Player Season Registrations junction table
-- Tracks which player registered for which division/season

CREATE TABLE IF NOT EXISTS player_season_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  skill_level_id UUID REFERENCES skill_levels(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(player_id, season_id, division_id)
);

-- Enable RLS
ALTER TABLE player_season_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Players can view their own registrations" ON player_season_registrations
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Anyone can read registrations" ON player_season_registrations
  FOR SELECT USING (true);

-- Coordinator can view all registrations for their org
CREATE POLICY "Coordinators can view org registrations" ON player_season_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.profile_id = auth.uid()
      AND coordinators.organization_id IN (
        SELECT organization_id FROM seasons WHERE seasons.id = player_season_registrations.season_id
      )
    )
  );