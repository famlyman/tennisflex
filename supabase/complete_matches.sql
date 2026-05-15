-- Complete ~95% of non-completed matches with realistic scores.
-- Safe to re-run (skips already completed matches).

DO $$
DECLARE
  v_match record;
  v_score text;
  v_winner_id uuid;
  v_total int := 0;
  v_skipped int := 0;
  v_target_count int;
  v_available_count int;
  v_scores text[] := ARRAY[
    '6-4 6-4',
    '6-3 6-3',
    '6-2 6-3',
    '6-4 3-6 6-3',
    '6-1 6-2',
    '7-5 6-4',
    '6-3 7-5',
    '6-2 6-2',
    '4-6 6-4 6-2',
    '6-0 6-1',
    '6-4 6-3',
    '6-3 6-4',
    '7-6(4) 6-4',
    '6-4 6-7(5) 6-2',
    '7-5 6-3',
    '5-7 6-3 6-4',
    '6-2 6-4',
    '6-4 6-2',
    '6-7(3) 6-3 7-5',
    '6-3 6-3'
  ];
BEGIN
  -- Count non-completed matches
  SELECT count(*) INTO v_available_count
  FROM matches
  WHERE status != 'completed' AND home_player_id IS NOT NULL AND away_player_id IS NOT NULL;

  IF v_available_count = 0 THEN
    RAISE NOTICE 'No non-completed matches found.';
    RETURN;
  END IF;

  v_target_count := GREATEST(1, ROUND(v_available_count * 0.95));

  RAISE NOTICE 'Completing % of % available matches (95%%)', v_target_count, v_available_count;

  FOR v_match IN
    SELECT id, home_player_id, away_player_id, random() AS rnd
    FROM matches
    WHERE status != 'completed' AND home_player_id IS NOT NULL AND away_player_id IS NOT NULL
    ORDER BY random()
    LIMIT v_target_count
  LOOP
    -- Random score
    v_score := v_scores[1 + floor(random() * array_length(v_scores, 1))::int];

    -- Random winner (50/50 home or away)
    v_winner_id := CASE WHEN random() < 0.5 THEN v_match.home_player_id ELSE v_match.away_player_id END;

    UPDATE matches
    SET
      status = 'completed',
      score = v_score,
      winner_id = v_winner_id,
      verified_by_opponent = true,
      scheduled_at = COALESCE(scheduled_at, now() - interval '1 day'),
      created_at = LEAST(created_at, now() - interval '1 day')
    WHERE id = v_match.id;

    v_total := v_total + 1;
  END LOOP;

  RAISE NOTICE 'Done. Completed % matches.', v_total;
END $$;
