-- Fix profiles table - Add missing columns
-- Run this in Supabase SQL Editor

-- Add location column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location text;

-- Add phone column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- Add play_preferences column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS play_preferences jsonb;

-- Add gender column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));

-- Add avatar_url column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add initial_ntrp_singles column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS initial_ntrp_singles numeric(3,1);

-- Add initial_ntrp_doubles column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS initial_ntrp_doubles numeric(3,1);

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
