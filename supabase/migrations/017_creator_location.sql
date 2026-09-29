-- Migration 017: Structured Location Fields for Creator Profiles
-- Adds country, state, and city with compound and individual indexes for efficient multi-level filtering

ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- Compound index for country, state, city filtering (e.g. India -> Uttar Pradesh -> Varanasi)
CREATE INDEX IF NOT EXISTS idx_creator_profiles_location ON public.creator_profiles(country, state, city);

-- Single field indexes for fast search and lookup
CREATE INDEX IF NOT EXISTS idx_creator_profiles_city ON public.creator_profiles(city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_state ON public.creator_profiles(state);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_country ON public.creator_profiles(country);

-- Update RLS policies verification
-- Authenticated creators can update their own profile including location
-- Public users have read access to creator profiles
