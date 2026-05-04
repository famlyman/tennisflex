-- Add is_ready_to_play column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_ready_to_play BOOLEAN DEFAULT true;

-- Update RLS if necessary (usually public read/write by owner is fine)
-- Add a comment for clarity
COMMENT ON COLUMN players.is_ready_to_play IS 'Quick toggle for players to indicate if they are actively looking for matches this week.';
