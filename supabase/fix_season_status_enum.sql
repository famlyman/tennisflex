-- Fix season_status enum - check current state and add missing values
-- Run step by step in your Supabase SQL editor

-- Step 1: Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'season_status'::regtype;

-- Step 2: Check what values exist in seasons table
SELECT DISTINCT status FROM seasons;