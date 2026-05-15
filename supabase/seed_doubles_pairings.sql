-- Tennis-Flex Doubles Pairings Seed
-- Dynamically pairs existing players into doubles teams.
-- Safe to re-run (clears + recreates doubles registrations).

DO $$
DECLARE
  v_org_id uuid;
  v_season_id uuid;
  v_div record;
  v_sl_id uuid;
  v_male_ids uuid[] := '{}';
  v_female_ids uuid[] := '{}';
  v_player_id uuid;
  v_partner_id uuid;
  v_profile_id uuid;
  v_idx int;
  v_partner_idx int;
  v_team_count int;
  v_total int := 0;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'tennis-flex-foothills';
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT id INTO v_season_id FROM seasons WHERE organization_id = v_org_id AND name = 'Summer Flex 2026';
  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  -- Gather male and female players in this org
  FOR v_player_id, v_profile_id IN
    SELECT p.id, p.profile_id
    FROM players p
    JOIN profiles pr ON pr.id = p.profile_id
    WHERE p.organization_id = v_org_id
    ORDER BY random()
  LOOP
    -- v_profile_id would need a subquery or join to get gender, but profiles table has gender
  END LOOP;

  -- Actually, let's use a simpler approach - collect players with gender
  SELECT array_agg(p.id ORDER BY random())
  INTO v_male_ids
  FROM players p
  JOIN profiles pr ON pr.id = p.profile_id
  WHERE p.organization_id = v_org_id AND pr.gender = 'male';

  SELECT array_agg(p.id ORDER BY random())
  INTO v_female_ids
  FROM players p
  JOIN profiles pr ON pr.id = p.profile_id
  WHERE p.organization_id = v_org_id AND pr.gender = 'female';

  RAISE NOTICE 'Found % male, % female players',
    coalesce(array_length(v_male_ids, 1), 0),
    coalesce(array_length(v_female_ids, 1), 0);

  -- Ensure partner columns exist
  ALTER TABLE season_registrations ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.players(id) ON DELETE SET NULL;
  ALTER TABLE season_registrations ADD COLUMN IF NOT EXISTS partner_email text;
  ALTER TABLE season_registrations ADD COLUMN IF NOT EXISTS partner_status text NOT NULL DEFAULT 'none';

  -- Loop over each doubles division
  FOR v_div IN
    SELECT d.id AS div_id, d.type
    FROM divisions d
    WHERE d.season_id = v_season_id AND d.type LIKE '%doubles'
  LOOP
    -- Get or create a 3.5 skill level for this division
    SELECT id INTO v_sl_id FROM skill_levels
    WHERE division_id = v_div.div_id AND name = '3.5';

    IF v_sl_id IS NULL THEN
      INSERT INTO skill_levels (id, division_id, name, min_rating, max_rating)
      VALUES (gen_random_uuid(), v_div.div_id, '3.5', 0, 99)
      RETURNING id INTO v_sl_id;
    END IF;

    -- Clear existing registrations + matches for this skill level
    DELETE FROM season_registrations WHERE skill_level_id = v_sl_id;
    DELETE FROM matches WHERE skill_level_id = v_sl_id;

    v_team_count := 0;

    -- Men's Doubles: pair males
    IF v_div.type = 'mens_doubles' THEN
      FOR v_idx IN 1..coalesce(array_length(v_male_ids, 1), 0) BY 2 LOOP
        v_partner_idx := v_idx + 1;
        IF v_partner_idx > coalesce(array_length(v_male_ids, 1), 0) THEN EXIT; END IF;

        v_player_id := v_male_ids[v_idx];
        v_partner_id := v_male_ids[v_partner_idx];

        SELECT profile_id INTO v_profile_id FROM players WHERE id = v_player_id;
        INSERT INTO season_registrations
          (player_id, profile_id, season_id, division_id, skill_level_id, status, partner_id, partner_status)
        VALUES (v_player_id, v_profile_id, v_season_id, v_div.div_id, v_sl_id, 'active', v_partner_id, 'confirmed');

        v_team_count := v_team_count + 1;
      END LOOP;
    END IF;

    -- Women's Doubles: pair females
    IF v_div.type = 'womens_doubles' THEN
      FOR v_idx IN 1..coalesce(array_length(v_female_ids, 1), 0) BY 2 LOOP
        v_partner_idx := v_idx + 1;
        IF v_partner_idx > coalesce(array_length(v_female_ids, 1), 0) THEN EXIT; END IF;

        v_player_id := v_female_ids[v_idx];
        v_partner_id := v_female_ids[v_partner_idx];

        SELECT profile_id INTO v_profile_id FROM players WHERE id = v_player_id;
        INSERT INTO season_registrations
          (player_id, profile_id, season_id, division_id, skill_level_id, status, partner_id, partner_status)
        VALUES (v_player_id, v_profile_id, v_season_id, v_div.div_id, v_sl_id, 'active', v_partner_id, 'confirmed');

        v_team_count := v_team_count + 1;
      END LOOP;
    END IF;

    -- Mixed Doubles: pair male[i] with female[i]
    IF v_div.type = 'mixed_doubles' THEN
      FOR v_idx IN 1..least(
        coalesce(array_length(v_male_ids, 1), 0),
        coalesce(array_length(v_female_ids, 1), 0)
      ) LOOP
        v_player_id := v_male_ids[v_idx];
        v_partner_id := v_female_ids[v_idx];

        SELECT profile_id INTO v_profile_id FROM players WHERE id = v_player_id;
        INSERT INTO season_registrations
          (player_id, profile_id, season_id, division_id, skill_level_id, status, partner_id, partner_status)
        VALUES (v_player_id, v_profile_id, v_season_id, v_div.div_id, v_sl_id, 'active', v_partner_id, 'confirmed');

        v_team_count := v_team_count + 1;
      END LOOP;
    END IF;

    RAISE NOTICE '%: % teams, % players', v_div.type, v_team_count, v_team_count * 2;
    v_total := v_total + v_team_count;
  END LOOP;

  RAISE NOTICE 'Done! Created % total doubles teams.', v_total;
END $$;
