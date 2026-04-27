-- Add description column to seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing skill levels to TFR scale (multiply by 10)
UPDATE skill_levels SET 
  min_rating = min_rating * 10,
  max_rating = CASE 
    WHEN max_rating IS NULL THEN NULL
    ELSE max_rating * 10
  END
WHERE min_rating < 20;