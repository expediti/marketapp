-- 015_creator_reels.sql
-- Creator portfolio reels, content samples, and video metadata

CREATE TABLE IF NOT EXISTS public.creator_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT,
    video_url TEXT NOT NULL,
    thumbnail_path TEXT,
    thumbnail_url TEXT,
    mime_type TEXT NOT NULL DEFAULT 'video/mp4',
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes <= 19922944), -- 19 MB max limit
    duration_seconds NUMERIC(6, 2),
    type TEXT NOT NULL DEFAULT 'demo' CHECK (type IN ('client_work', 'demo')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'video/mp4';
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(6, 2);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_creator_reels_updated ON public.creator_reels;
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

DROP POLICY IF EXISTS "Public reels are viewable by everyone" ON public.creator_reels;
CREATE POLICY "Public reels are viewable by everyone"
    ON public.creator_reels FOR SELECT
    TO anon, authenticated
    USING (is_visible = true OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can insert own reels" ON public.creator_reels;
CREATE POLICY "Creators can insert own reels"
    ON public.creator_reels FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can update own reels" ON public.creator_reels;
CREATE POLICY "Creators can update own reels"
    ON public.creator_reels FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can delete own reels" ON public.creator_reels;
CREATE POLICY "Creators can delete own reels"
    ON public.creator_reels FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());
