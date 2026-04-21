-- Check RLS policies on seasons table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'seasons';

-- Check if there are any policies at all
SELECT 
  polname,
  polcmd,
  polroles::regrole[]
FROM pg_policy
JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE pg_class.relname = 'seasons';