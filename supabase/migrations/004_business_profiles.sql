-- 004_business_profiles.sql
-- Business / Advertiser profiles for apps, websites, products, and services

CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    logo_path TEXT,
    website TEXT,
    app_url TEXT,
    description TEXT,
    business_type TEXT NOT NULL DEFAULT 'app' CHECK (business_type IN ('app', 'website', 'product', 'service')),
    category TEXT,
    industry TEXT NOT NULL DEFAULT 'Technology & SaaS',
    city TEXT NOT NULL DEFAULT 'India',
    state TEXT,
    target_audience TEXT,
    target_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    budget_range TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS logo_path TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS app_url TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'app';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS target_locations TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS budget_range TEXT;

DROP TRIGGER IF EXISTS on_business_profiles_updated ON public.business_profiles;
CREATE TRIGGER on_business_profiles_updated
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
