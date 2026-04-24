-- Add coordinator for Tennis-Flex Seattle
-- Run this in Supabase SQL Editor

-- Get org ID first
SELECT id, name FROM organizations WHERE slug = 'seattle-test';

-- Insert coordinator using your existing user ID
INSERT INTO coordinators (profile_id, organization_id, role)
SELECT '03c2cfcd-25c5-47e0-8b40-a180b90fdb38', id, 'admin'
FROM organizations WHERE slug = 'seattle-test'
ON CONFLICT DO NOTHING;

-- Verify
SELECT c.role, p.full_name, o.name as organization
FROM coordinators c
JOIN profiles p ON c.profile_id = p.id
JOIN organizations o ON c.organization_id = o.id
WHERE o.slug = 'seattle-test';