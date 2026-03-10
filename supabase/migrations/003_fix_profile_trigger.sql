-- Fix the profile creation trigger
-- This ensures every new user gets a profile automatically

-- First, check if the trigger exists and recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Make sure the function exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create missing profiles for existing users
INSERT INTO public.profiles (id, is_admin, created_at, updated_at)
SELECT 
  auth.users.id,
  false,
  NOW(),
  NOW()
FROM auth.users
LEFT JOIN public.profiles ON auth.users.id = profiles.id
WHERE profiles.id IS NULL;

-- Make alfredo an admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id = '53ffa8c8-95ae-44df-920a-afec2d17158f';
