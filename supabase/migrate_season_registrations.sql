-- Add profile_id column to season_registrations
-- This migration adds profile_id to support registrations tracked by profile

ALTER TABLE season_registrations ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_season_registrations_profile ON season_registrations(profile_id);

-- Update RLS policy to allow viewing by profile_id
DROP POLICY IF EXISTS "Players can view own registrations" ON season_registrations;
CREATE POLICY "Players can view own registrations" ON season_registrations
FOR SELECT USING (
  player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
  OR profile_id = auth.uid()
);

SELECT 'Added profile_id column to season_registrations' as status;