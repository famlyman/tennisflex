-- Tennis-Flex Seed Data - Clean slate
-- Run entire script as ONE query

-- ============================================================================
-- 1. Clean all old seed data first
-- ============================================================================
DELETE FROM matches WHERE skill_level_id IN (
  SELECT id FROM skill_levels WHERE division_id IN (
    SELECT id FROM divisions WHERE season_id IN (
      SELECT id FROM seasons WHERE name = 'Spring 2026'
    )
  )
);

DELETE FROM skill_levels WHERE division_id IN (
  SELECT id FROM divisions WHERE season_id IN (
    SELECT id FROM seasons WHERE name = 'Spring 2026'
  )
);

DELETE FROM divisions WHERE season_id IN (
  SELECT id FROM seasons WHERE name = 'Spring 2026'
);

DELETE FROM seasons WHERE name = 'Spring 2026';
DELETE FROM organizations WHERE slug = 'seattle-test';
DELETE FROM players WHERE organization_id IN (SELECT id FROM organizations WHERE slug = 'seattle-test');

DELETE FROM profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888'
);

-- ============================================================================
-- 2. Disable FK
-- ============================================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ============================================================================
-- 3. Create profiles FIRST (outside transaction block)
-- ============================================================================
INSERT INTO profiles (id, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice Anderson'),
  ('22222222-2222-2222-2222-222222222222', 'Bob Brown'),
  ('33333333-3333-3333-3333-333333333333', 'Carol Chen'),
  ('44444444-4444-4444-4444-444444444444', 'David Davis'),
  ('55555555-5555-5555-5555-555555555555', 'Eve Evans'),
  ('66666666-6666-6666-6666-666666666666', 'Frank Foster'),
  ('77777777-7777-7777-7777-777777777777', 'Grace Green'),
  ('88888888-8888-8888-8888-888888888888', 'Henry Harris')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ============================================================================
-- 4. Create org, season, divisions, skill levels, players, matches
-- ============================================================================
DO $$
DECLARE
  v_org_id uuid;
  v_season_id uuid;
  v_mens_div_id uuid;
  v_womens_div_id uuid;
  v_mens_level_id uuid;
  v_womens_level_id uuid;
  v_p1 uuid; v_p2 uuid; v_p3 uuid; v_p4 uuid;
  v_p5 uuid; v_p6 uuid; v_p7 uuid; v_p8 uuid;
BEGIN
  -- Organization
  INSERT INTO organizations (id, name, slug) VALUES (gen_random_uuid(), 'Tennis-Flex Seattle', 'seattle-test') RETURNING id INTO v_org_id;

  -- Season
  INSERT INTO seasons (id, organization_id, name, status, registration_start, registration_end, season_start, season_end, points_config)
  VALUES (gen_random_uuid(), v_org_id, 'Spring 2026', 'active', '2026-01-01', '2026-02-28', '2026-03-01', '2026-05-31', '{"win": 2, "loss": 1, "forfeit": 0, "default_win": 2}')
  RETURNING id INTO v_season_id;

  -- Mens Division
  INSERT INTO divisions (id, season_id, name, type) VALUES (gen_random_uuid(), v_season_id, 'Mens 3.5', 'mens_singles') RETURNING id INTO v_mens_div_id;

  -- Womens Division
  INSERT INTO divisions (id, season_id, name, type) VALUES (gen_random_uuid(), v_season_id, 'Womens 3.5', 'womens_singles') RETURNING id INTO v_womens_div_id;

  -- Mens Skill Level
  INSERT INTO skill_levels (id, division_id, name, min_rating, max_rating) VALUES (gen_random_uuid(), v_mens_div_id, '3.5', 35, 45) RETURNING id INTO v_mens_level_id;

  -- Womens Skill Level
  INSERT INTO skill_levels (id, division_id, name, min_rating, max_rating) VALUES (gen_random_uuid(), v_womens_div_id, '3.5', 35, 45) RETURNING id INTO v_womens_level_id;

  -- Players
  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v_org_id, 3.5, 3.5, 35, 35, 4.0, 0, 0, 0) RETURNING id INTO v_p1;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', v_org_id, 3.0, 3.5, 30, 35, 4.0, 0, 0, 0) RETURNING id INTO v_p2;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', v_org_id, 4.0, 3.5, 40, 35, 4.0, 0, 0, 0) RETURNING id INTO v_p3;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', v_org_id, 3.5, 3.0, 35, 30, 4.0, 0, 0, 0) RETURNING id INTO v_p4;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', v_org_id, 3.5, 3.5, 35, 35, 4.0, 0, 0, 0) RETURNING id INTO v_p5;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', v_org_id, 3.0, 3.0, 30, 30, 4.0, 0, 0, 0) RETURNING id INTO v_p6;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', v_org_id, 4.0, 4.0, 40, 40, 4.0, 0, 0, 0) RETURNING id INTO v_p7;

  INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, initial_ntrp_doubles, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles, flag_count) 
  VALUES (gen_random_uuid(), '88888888-8888-8888-8888-888888888888', v_org_id, 3.5, 3.5, 35, 35, 4.0, 0, 0, 0) RETURNING id INTO v_p8;

  -- Mens Matches
  INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, score, winner_id, verified_by_opponent) VALUES
    (gen_random_uuid(), v_mens_level_id, v_p1, v_p2, 'completed', '6-4 6-4', v_p1, true),
    (gen_random_uuid(), v_mens_level_id, v_p3, v_p4, 'completed', '6-7(3) 6-4 1-0', v_p3, true),
    (gen_random_uuid(), v_mens_level_id, v_p1, v_p3, 'completed', '2-6 2-6', v_p3, true),
    (gen_random_uuid(), v_mens_level_id, v_p2, v_p4, 'completed', '6-3 6-3', v_p2, true),
    (gen_random_uuid(), v_mens_level_id, v_p1, v_p4, 'scheduled', NULL, NULL, false),
    (gen_random_uuid(), v_mens_level_id, v_p2, v_p3, 'scheduled', NULL, NULL, false);

  -- Womens Matches
  INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, score, winner_id, verified_by_opponent) VALUES
    (gen_random_uuid(), v_womens_level_id, v_p5, v_p6, 'completed', '6-2 6-2', v_p5, true),
    (gen_random_uuid(), v_womens_level_id, v_p7, v_p8, 'completed', '4-6 4-6', v_p7, true),
    (gen_random_uuid(), v_womens_level_id, v_p5, v_p7, 'completed', '6-4 3-6 0-1', v_p7, true),
    (gen_random_uuid(), v_womens_level_id, v_p6, v_p8, 'completed', '6-0 6-0', v_p6, true),
    (gen_random_uuid(), v_womens_level_id, v_p5, v_p8, 'scheduled', NULL, NULL, false),
    (gen_random_uuid(), v_womens_level_id, v_p6, v_p7, 'scheduled', NULL, NULL, false);

  RAISE NOTICE 'Seed complete!';
END $$;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'Orgs' as info, * FROM organizations WHERE slug = 'seattle-test';
SELECT 'Seasons' as info, * FROM seasons WHERE name = 'Spring 2026';
SELECT 'Players' as info, p.full_name, pl.tfr_singles FROM players pl JOIN profiles p ON pl.profile_id = p.id;
SELECT 'Matches' as info, COUNT(*) FROM matches;