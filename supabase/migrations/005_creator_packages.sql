-- 005_creator_packages.sql
-- Fixed collaboration packages offered by creators / influencers

CREATE TABLE IF NOT EXISTS public.creator_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Instagram',
    content_type TEXT NOT NULL DEFAULT 'Reel',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT NOT NULL,
    deliverables TEXT[] DEFAULT ARRAY[]::TEXT[],
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    revision_count INTEGER NOT NULL DEFAULT 1 CHECK (revision_count >= 0),
    revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'Instagram';
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'Reel';
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS deliverables TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS revisions INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.creator_packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_creator_packages_creator_id ON public.creator_packages(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_packages_price ON public.creator_packages(price);

DROP TRIGGER IF EXISTS on_creator_packages_updated ON public.creator_packages;
CREATE TRIGGER on_creator_packages_updated
    BEFORE UPDATE ON public.creator_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
