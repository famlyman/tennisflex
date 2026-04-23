-- Check what's in season_registrations
SELECT 
  sr.id,
  sr.player_id,
  sr.profile_id,
  sr.season_id,
  sr.division_id,
  sr.status,
  sr.created_at
FROM season_registrations sr
ORDER BY sr.created_at DESC
LIMIT 10;