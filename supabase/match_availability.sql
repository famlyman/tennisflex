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
