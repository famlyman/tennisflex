-- Migration: Technical Debt Fixes
-- Date: April 28, 2026
-- Description: Fix indexes, constraints, and ensure notifications table exists

-- ============================================
-- 1. Fix skill_levels duplicate prevention
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'skill_levels_division_id_name_key'
  ) THEN
    ALTER TABLE skill_levels 
    ADD CONSTRAINT skill_levels_division_id_name_key 
    UNIQUE(division_id, name);
  END IF;
END
$$;

-- ============================================
-- 2. Add performance indexes
-- ============================================

-- Index for matches lookup by skill_level_id
CREATE INDEX IF NOT EXISTS idx_matches_skill_level_id 
ON matches(skill_level_id);

-- Index for season_registrations lookups
CREATE INDEX IF NOT EXISTS idx_season_registrations_player_season 
ON season_registrations(player_id, season_id);

-- Index for season_registrations by division
CREATE INDEX IF NOT EXISTS idx_season_registrations_division 
ON season_registrations(division_id);

-- Index for players by profile_id (common lookup)
CREATE INDEX IF NOT EXISTS idx_players_profile_id 
ON players(profile_id);

-- Index for matches by player (for quick player match history)
CREATE INDEX IF NOT EXISTS idx_matches_home_player 
ON matches(home_player_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_player 
ON matches(away_player_id);

-- ============================================
-- 3. Ensure notifications table exists
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read);

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Service role can manage notifications'
  ) THEN
    CREATE POLICY "Service role can manage notifications" ON notifications
    FOR ALL USING (auth.role() = 'service_role');
  END IF;
END
$$;

-- ============================================
-- 4. Fix season_registrations unique constraint
-- ============================================

-- Drop old constraint if exists
ALTER TABLE season_registrations 
DROP CONSTRAINT IF EXISTS season_registrations_player_id_season_id_key;

-- Add correct 3-column constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'season_registrations_unique'
  ) THEN
    ALTER TABLE season_registrations 
    ADD CONSTRAINT season_registrations_unique 
    UNIQUE(player_id, season_id, division_id);
  END IF;
END
$$;

-- ============================================
-- Done!
-- ============================================

SELECT 'Technical debt fixes applied successfully' as status;
