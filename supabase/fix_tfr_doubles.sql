-- Fix players with tfr_doubles = 0 (default never set)
-- Sets tfr_doubles from initial_ntrp_doubles, or falls back to tfr_singles
UPDATE players
SET tfr_doubles = COALESCE(initial_ntrp_doubles * 10, tfr_singles, 35)
WHERE tfr_doubles = 0;
