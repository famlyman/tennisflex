-- Add gender column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));

-- Allow users to update their own profile gender
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Note: Run the add_gender.sql as well if you haven't already