-- 019_campaigns.sql
-- Campaigns table for businesses promoting mobile apps, websites, SaaS, products, or services

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'app' CHECK (product_type IN ('app', 'website', 'saas', 'product', 'service')),
    app_url TEXT,
    website_url TEXT,
    category TEXT,
    description TEXT,
    campaign_brief TEXT,
    target_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    budget NUMERIC(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by business_id
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Automatic updated_at trigger
DROP TRIGGER IF EXISTS on_campaigns_updated ON public.campaigns;
CREATE TRIGGER on_campaigns_updated
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Businesses can view own campaigns" ON public.campaigns;
CREATE POLICY "Businesses can view own campaigns"
    ON public.campaigns FOR SELECT
    TO authenticated
    USING (auth.uid() = business_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can insert own campaigns" ON public.campaigns;
CREATE POLICY "Businesses can insert own campaigns"
    ON public.campaigns FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = business_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can update own campaigns" ON public.campaigns;
CREATE POLICY "Businesses can update own campaigns"
    ON public.campaigns FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_id OR public.is_admin())
    WITH CHECK (auth.uid() = business_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can delete own campaigns" ON public.campaigns;
CREATE POLICY "Businesses can delete own campaigns"
    ON public.campaigns FOR DELETE
    TO authenticated
    USING (auth.uid() = business_id OR public.is_admin());

-- Ensure country column is present on business_profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';

