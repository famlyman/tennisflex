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

DELETE FROM season_registrations WHERE season_id IN (
  SELECT id FROM seasons WHERE name = 'Spring 2026'
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
DELETE FROM players WHERE organization_id IN (SELECT id FROM organizations WHERE slug = 'seattle-test');
DELETE FROM organizations WHERE slug = 'seattle-test';

-- Cleanup seed profiles by specific IDs
DELETE FROM profiles WHERE id IN (
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000020'
);

-- ============================================================================
-- 2. Create profiles FIRST
-- ============================================================================
INSERT INTO profiles (id, full_name, gender) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bob Brown', 'male'),
  ('00000000-0000-0000-0000-000000000002', 'David Davis', 'male'),
  ('00000000-0000-0000-0000-000000000003', 'Frank Foster', 'male'),
  ('00000000-0000-0000-0000-000000000004', 'Henry Harris', 'male'),
  ('00000000-0000-0000-0000-000000000005', 'Ian Irvine', 'male'),
  ('00000000-0000-0000-0000-000000000006', 'Jack Jackson', 'male'),
  ('00000000-0000-0000-0000-000000000007', 'Liam Lewis', 'male'),
  ('00000000-0000-0000-0000-000000000008', 'Noah Nelson', 'male'),
  ('00000000-0000-0000-0000-000000000009', 'Paul Parker', 'male'),
  ('00000000-0000-0000-0000-000000000010', 'Sam Smith', 'male'),
  ('00000000-0000-0000-0000-000000000011', 'Alice Anderson', 'female'),
  ('00000000-0000-0000-0000-000000000012', 'Carol Chen', 'female'),
  ('00000000-0000-0000-0000-000000000013', 'Eve Evans', 'female'),
  ('00000000-0000-0000-0000-000000000014', 'Grace Green', 'female'),
  ('00000000-0000-0000-0000-000000000015', 'Kate Knight', 'female'),
  ('00000000-0000-0000-0000-000000000016', 'Mary Miller', 'female'),
  ('00000000-0000-0000-0000-000000000017', 'Olivia Owens', 'female'),
  ('00000000-0000-0000-0000-000000000018', 'Quinn Quigley', 'female'),
  ('00000000-0000-0000-0000-000000000019', 'Riley Reed', 'female'),
  ('00000000-0000-0000-0000-000000000020', 'Tina Taylor', 'female')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, gender = EXCLUDED.gender;

-- ============================================================================
-- 3. Create org, season, divisions, skill levels, players, matches
-- ============================================================================
DO $$
DECLARE
  v_org_id uuid;
  v_season_id uuid;
  v_mens_div_id uuid;
  v_womens_div_id uuid;
  v_mens_level_id uuid;
  v_womens_level_id uuid;
  v_profile_id uuid;
  v_player_id uuid;
  v_opponent_id uuid;
  i integer;
  v_player_ids uuid[] := '{}';
  v_womens_player_ids uuid[] := '{}';
BEGIN
  -- Organization
  INSERT INTO organizations (id, name, slug) VALUES (gen_random_uuid(), 'Tennis-Flex Seattle', 'seattle-test') RETURNING id INTO v_org_id;

  -- Season
  INSERT INTO seasons (id, organization_id, name, status, registration_start, registration_end, season_start, season_end, points_config)
  VALUES (gen_random_uuid(), v_org_id, 'Spring 2026', 'active', '2026-01-01', '2026-02-28', '2026-03-01', '2026-05-31', '{"win": 2, "loss": 1, "forfeit": 0, "default_win": 2}')
  RETURNING id INTO v_season_id;

  -- Mens Division
  INSERT INTO divisions (id, season_id, name, type) VALUES (gen_random_uuid(), v_season_id, 'Mens Singles', 'mens_singles') RETURNING id INTO v_mens_div_id;

  -- Womens Division
  INSERT INTO divisions (id, season_id, name, type) VALUES (gen_random_uuid(), v_season_id, 'Womens Singles', 'womens_singles') RETURNING id INTO v_womens_div_id;

  -- Mens Skill Level
  INSERT INTO skill_levels (id, division_id, name, min_rating, max_rating) VALUES (gen_random_uuid(), v_mens_div_id, '3.5', 35, 45) RETURNING id INTO v_mens_level_id;

  -- Womens Skill Level
  INSERT INTO skill_levels (id, division_id, name, min_rating, max_rating) VALUES (gen_random_uuid(), v_womens_div_id, '3.5', 35, 45) RETURNING id INTO v_womens_level_id;

  -- Create Mens Players
  FOR i IN 1..10 LOOP
    v_profile_id := ('00000000-0000-0000-0000-0000000000' || LPAD(i::text, 2, '0'))::uuid;
    INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, tfr_singles, rating_deviation, is_ready_to_play)
    VALUES (gen_random_uuid(), v_profile_id, v_org_id, 3.5, 35 + (random() * 5), 4.0, true)
    RETURNING id INTO v_player_id;
    
    v_player_ids := array_append(v_player_ids, v_player_id);

    -- Registration
    INSERT INTO season_registrations (player_id, season_id, division_id, skill_level_id, status)
    VALUES (v_player_id, v_season_id, v_mens_div_id, v_mens_level_id, 'active');
  END LOOP;

  -- Create Womens Players
  FOR i IN 11..20 LOOP
    v_profile_id := ('00000000-0000-0000-0000-0000000000' || LPAD(i::text, 2, '0'))::uuid;
    INSERT INTO players (id, profile_id, organization_id, initial_ntrp_singles, tfr_singles, rating_deviation, is_ready_to_play)
    VALUES (gen_random_uuid(), v_profile_id, v_org_id, 3.5, 35 + (random() * 5), 4.0, true)
    RETURNING id INTO v_player_id;
    
    v_womens_player_ids := array_append(v_womens_player_ids, v_player_id);

    -- Registration
    INSERT INTO season_registrations (player_id, season_id, division_id, skill_level_id, status)
    VALUES (v_player_id, v_season_id, v_womens_div_id, v_womens_level_id, 'active');
  END LOOP;

  -- Generate some completed matches for Mens
  FOR i IN 1..5 LOOP
    v_player_id := v_player_ids[i];
    v_opponent_id := v_player_ids[i+5];
    
    INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, score, winner_id, verified_by_opponent, created_at)
    VALUES (gen_random_uuid(), v_mens_level_id, v_player_id, v_opponent_id, 'completed', '6-4 6-4', v_player_id, true, now() - (i || ' days')::interval);
  END LOOP;

  -- Generate some scheduled matches for Mens
  FOR i IN 1..5 LOOP
    v_player_id := v_player_ids[i];
    v_opponent_id := v_player_ids[((i+2) % 10) + 1];
    
    IF v_player_id != v_opponent_id THEN
      INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, scheduled_at)
      VALUES (gen_random_uuid(), v_mens_level_id, v_player_id, v_opponent_id, 'scheduled', now() + (i || ' days')::interval);
    END IF;
  END LOOP;

  -- Generate some completed matches for Womens
  FOR i IN 1..5 LOOP
    v_player_id := v_womens_player_ids[i];
    v_opponent_id := v_womens_player_ids[i+5];
    
    INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, score, winner_id, verified_by_opponent, created_at)
    VALUES (gen_random_uuid(), v_womens_level_id, v_player_id, v_opponent_id, 'completed', '6-2 6-3', v_player_id, true, now() - (i || ' days')::interval);
  END LOOP;

  -- Generate some scheduled matches for Womens
  FOR i IN 1..5 LOOP
    v_player_id := v_womens_player_ids[i];
    v_opponent_id := v_womens_player_ids[((i+3) % 10) + 1];
    
    IF v_player_id != v_opponent_id THEN
      INSERT INTO matches (id, skill_level_id, home_player_id, away_player_id, status, scheduled_at)
      VALUES (gen_random_uuid(), v_womens_level_id, v_player_id, v_opponent_id, 'scheduled', now() + (i || ' days')::interval);
    END IF;
  END LOOP;

  RAISE NOTICE 'Seed complete with 20 players and initial schedule!';
END $$;
