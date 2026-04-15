-- Add region column to organizations table
-- Run this in your Supabase SQL Editor

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS region TEXT;