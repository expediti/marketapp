-- 018_role_selection_and_google_oauth.sql
-- Enables nullable role for initial Google OAuth sign-in and idempotent profile management

-- 1. Allow role to be NULL on profiles initially until role selection is completed
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 2. Update check constraint to allow NULL role or valid roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IS NULL OR role IN ('advertiser', 'influencer', 'creator', 'business', 'promoter', 'admin'));

-- 3. Update handle_new_user() trigger for Google OAuth and email signups
-- Extracts Google profile name and avatar picture, keeping role NULL if not selected
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    avatar TEXT;
    assigned_role TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );
    
    avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );

    assigned_role := NEW.raw_user_meta_data->>'role';

    INSERT INTO public.profiles (id, email, display_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        avatar,
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS policies allow authenticated users to INSERT their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 5. Ensure RLS policies allow authenticated users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 6. Ensure RLS policies allow authenticated users to view profiles
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);
