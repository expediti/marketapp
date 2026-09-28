-- 003_creator_profiles.sql
-- Creator specific verified metrics and profile details

CREATE TABLE IF NOT EXISTS public.creator_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    bio TEXT,
    instagram_connected BOOLEAN NOT NULL DEFAULT false,
    instagram_verified BOOLEAN NOT NULL DEFAULT false,
    follower_count INTEGER NOT NULL DEFAULT 0,
    average_reach INTEGER NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    audience_gender JSONB NOT NULL DEFAULT '{"female": 50, "male": 50}'::jsonb,
    audience_age JSONB NOT NULL DEFAULT '{"18-24": 40, "25-34": 40, "35+": 20}'::jsonb,
    audience_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER on_creator_profiles_updated
    BEFORE UPDATE ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Creator sample work showcases (watermarked/curated thumbnails, no external IG links)
CREATE TABLE IF NOT EXISTS public.creator_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
