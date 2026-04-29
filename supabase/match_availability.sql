-- Create match_availability table for player scheduling
CREATE TABLE IF NOT EXISTS match_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_slots TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id, date)
);

-- Enable RLS
ALTER TABLE match_availability ENABLE ROW LEVEL SECURITY;

-- Allow players to manage their own availability
CREATE POLICY "Players can manage own availability" ON match_availability
  FOR ALL USING (
    player_id IN (
      SELECT id FROM players WHERE profile_id = auth.uid()
    )
  );

-- Allow coordinators to view availability for their organization's matches
CREATE POLICY "Coordinators can view availability" ON match_availability
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN skill_levels sl ON sl.id = m.skill_level_id
      JOIN divisions d ON d.id = sl.division_id
      JOIN seasons s ON s.id = d.season_id
      WHERE s.organization_id IN (
        SELECT organization_id FROM coordinators WHERE profile_id = auth.uid()
      )
    )
  );
