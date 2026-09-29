-- 003_creator_profiles.sql
-- Creator / Influencer specific verified metrics and profile details

CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    profile_image_path TEXT,
    city TEXT,
    state TEXT,
    languages TEXT[] DEFAULT ARRAY['Hindi', 'English'],
    categories TEXT[] DEFAULT ARRAY['Technology'],
    niche TEXT NOT NULL DEFAULT 'Technology',
    audience_age JSONB NOT NULL DEFAULT '{"18-24": 50, "25-34": 35, "35+": 15}'::jsonb,
    audience_gender JSONB NOT NULL DEFAULT '{"female": 45, "male": 55}'::jsonb,
    audience_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    follower_count INTEGER NOT NULL DEFAULT 0,
    average_reach INTEGER NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    instagram_connected BOOLEAN NOT NULL DEFAULT false,
    instagram_user_id TEXT,
    instagram_verified BOOLEAN NOT NULL DEFAULT false,
    metrics_source TEXT NOT NULL DEFAULT 'platform_manual' CHECK (metrics_source IN ('platform_manual', 'instagram_meta_verified')),
    metrics_verified_at TIMESTAMPTZ,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS profile_image_path TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Hindi', 'English'];
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY['Technology'];
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS metrics_source TEXT NOT NULL DEFAULT 'platform_manual';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS metrics_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche ON public.creator_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_follower_count ON public.creator_profiles(follower_count);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_average_reach ON public.creator_profiles(average_reach);

DROP TRIGGER IF EXISTS on_creator_profiles_updated ON public.creator_profiles;
CREATE TRIGGER on_creator_profiles_updated
    BEFORE UPDATE ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Creator sample work showcases
CREATE TABLE IF NOT EXISTS public.creator_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
