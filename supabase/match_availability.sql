<<<<<<< HEAD
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
=======
-- Match Availability Table
-- Allows players to set specific dates they're available for a match

CREATE TABLE IF NOT EXISTS match_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(match_id, player_id, available_date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_match_availability_match 
ON match_availability(match_id);

CREATE INDEX IF NOT EXISTS idx_match_availability_player 
ON match_availability(player_id);

-- RLS Policies
ALTER TABLE match_availability ENABLE ROW LEVEL SECURITY;

-- Players can view availability for their matches
CREATE POLICY "Players can view match availability" ON match_availability
FOR SELECT USING (
  player_id IN (
    SELECT id FROM players 
    WHERE profile_id = auth.uid()
  ) OR
  match_id IN (
    SELECT id FROM matches 
    WHERE home_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
    OR away_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
  )
);

-- Players can only insert/update their own availability
CREATE POLICY "Players can insert own availability" ON match_availability
FOR INSERT WITH CHECK (
  player_id IN (
    SELECT id FROM players 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Players can delete own availability" ON match_availability
FOR DELETE USING (
  player_id IN (
    SELECT id FROM players 
    WHERE profile_id = auth.uid()
  )
);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON match_availability
FOR ALL USING (auth.role() = 'service_role');

-- Verify
SELECT 'match_availability table created' as status;
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
