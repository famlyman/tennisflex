-- Universal Player Availability Migration
-- Remove match-specific availability and make it player-based

-- First, backup existing data if needed (optional)
-- CREATE TABLE match_availability_backup AS SELECT * FROM match_availability;

-- Drop the old table
DROP TABLE IF EXISTS match_availability;

-- Create new universal availability table
CREATE TABLE IF NOT EXISTS player_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(player_id, available_date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_player_availability_player 
ON player_availability(player_id);

CREATE INDEX IF NOT EXISTS idx_player_availability_date 
ON player_availability(available_date);

-- RLS Policies
ALTER TABLE player_availability ENABLE ROW LEVEL SECURITY;

-- Players can view all availability (to see opponents' dates)
CREATE POLICY "Players can view all availability" ON player_availability
FOR SELECT USING (true);

-- Players can only insert/update their own availability
CREATE POLICY "Players can insert own availability" ON player_availability
FOR INSERT WITH CHECK (
  player_id IN (
    SELECT id FROM players 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Players can delete own availability" ON player_availability
FOR DELETE USING (
  player_id IN (
    SELECT id FROM players 
    WHERE profile_id = auth.uid()
  )
);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON player_availability
FOR ALL USING (auth.role() = 'service_role');

-- Verify
SELECT 'player_availability table created' as status;
