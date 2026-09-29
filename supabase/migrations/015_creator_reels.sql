-- 015_creator_reels.sql
-- Creator portfolio reels and work samples

CREATE TABLE IF NOT EXISTS public.creator_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    type TEXT NOT NULL DEFAULT 'demo' CHECK (type IN ('client_work', 'demo')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER on_creator_reels_updated
    BEFORE UPDATE ON public.creator_reels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for fast discovery queries
CREATE INDEX IF NOT EXISTS idx_creator_reels_creator_id ON public.creator_reels(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_visible ON public.creator_reels(is_visible);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_featured ON public.creator_reels(is_featured);
CREATE INDEX IF NOT EXISTS idx_creator_reels_sort_order ON public.creator_reels(sort_order);

-- Row Level Security
ALTER TABLE public.creator_reels ENABLE ROW LEVEL SECURITY;

-- 1. Public discovery: visible reels viewable by everyone; creators/admin can see unlisted
CREATE POLICY "Public reels are viewable by everyone"
    ON public.creator_reels FOR SELECT
    TO anon, authenticated
    USING (is_visible = true OR auth.uid() = creator_id OR public.is_admin());

-- 2. Creators can insert own reels
CREATE POLICY "Creators can insert own reels"
    ON public.creator_reels FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id OR public.is_admin());

-- 3. Creators can update own reels
CREATE POLICY "Creators can update own reels"
    ON public.creator_reels FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 4. Creators can delete own reels
CREATE POLICY "Creators can delete own reels"
    ON public.creator_reels FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());
