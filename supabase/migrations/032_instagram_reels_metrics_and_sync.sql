-- ============================================================================
-- 032_instagram_reels_metrics_and_sync.sql
-- Add Instagram Reels metrics, engagement counts, and media metadata support
-- ============================================================================

-- 1. Safely add metric and media tracking columns to public.creator_reels
ALTER TABLE public.creator_reels
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saved_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'VIDEO',
ADD COLUMN IF NOT EXISTS media_product_type TEXT DEFAULT 'REELS',
ADD COLUMN IF NOT EXISTS permalink TEXT,
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Comments for database documentation
COMMENT ON COLUMN public.creator_reels.like_count IS 'Total likes returned directly from Meta Graph API /me/media.';
COMMENT ON COLUMN public.creator_reels.comments_count IS 'Total comments count returned directly from Meta Graph API /me/media.';
COMMENT ON COLUMN public.creator_reels.view_count IS 'Total views or plays count returned from Instagram Insights where available.';
COMMENT ON COLUMN public.creator_reels.permalink IS 'Canonical Instagram web permalink (https://www.instagram.com/reel/...).';
COMMENT ON COLUMN public.creator_reels.posted_at IS 'Original publish timestamp of the Reel on Instagram.';
COMMENT ON COLUMN public.creator_reels.last_synced_at IS 'Timestamp of the most recent Meta Graph API sync for this media item.';

-- 2. Indexes for fast ordering and public portfolio lookups
CREATE INDEX IF NOT EXISTS idx_creator_reels_creator_visible ON public.creator_reels(creator_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_creator_reels_creator_featured ON public.creator_reels(creator_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_creator_reels_media_id ON public.creator_reels(instagram_media_id);

-- 3. Ensure Row Level Security (RLS) allows reading public reels with all metrics
ALTER TABLE public.creator_reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reels are viewable by everyone" ON public.creator_reels;
CREATE POLICY "Public reels are viewable by everyone"
    ON public.creator_reels FOR SELECT
    TO anon, authenticated
    USING (is_visible = true OR auth.uid() = creator_id OR public.is_admin());
