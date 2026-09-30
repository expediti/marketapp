-- ============================================================================
-- MARKET MY APP — MASTER CONSOLIDATED DATABASE SCHEMA (schema.sql)
-- Complete, bootstrap-ready database schema for Supabase / PostgreSQL.
--
-- Notes:
-- - All user identity is strictly UUID-based mapped to auth.users(id).
-- - Development history is preserved in supabase/migrations/*.sql
-- - Execute this file directly in any fresh Supabase SQL editor to bootstrap
--   all extensions, tables, foreign keys, triggers, RLS policies, and storage.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if current authenticated user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. PROFILES TABLE (Linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IS NULL OR role IN ('advertiser', 'influencer', 'creator', 'business', 'promoter', 'admin')),
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth.user created (handles Google OAuth & email signups)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. CREATOR / INFLUENCER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    profile_image_path TEXT,
    country TEXT DEFAULT 'India',
    state TEXT,
    city TEXT,
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

CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche ON public.creator_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_follower_count ON public.creator_profiles(follower_count);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_average_reach ON public.creator_profiles(average_reach);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_location ON public.creator_profiles(country, state, city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_city ON public.creator_profiles(city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_state ON public.creator_profiles(state);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_country ON public.creator_profiles(country);

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

-- ============================================================================
-- 5. BUSINESS / ADVERTISER PROFILES TABLE
-- ============================================================================
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
    country TEXT DEFAULT 'India',
    target_audience TEXT,
    target_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    budget_range TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS on_business_profiles_updated ON public.business_profiles;
CREATE TRIGGER on_business_profiles_updated
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. CREATOR PACKAGES TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_creator_packages_creator_id ON public.creator_packages(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_packages_price ON public.creator_packages(price);

DROP TRIGGER IF EXISTS on_creator_packages_updated ON public.creator_packages;
CREATE TRIGGER on_creator_packages_updated
    BEFORE UPDATE ON public.creator_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. CREATOR REELS TABLE (19 MB MAX FILE SIZE CONSTRAINT)
-- ============================================================================
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
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes <= 19922944), -- 19 MB limit
    duration_seconds NUMERIC(6, 2),
    type TEXT NOT NULL DEFAULT 'demo' CHECK (type IN ('client_work', 'demo')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_creator_reels_creator_id ON public.creator_reels(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_visible ON public.creator_reels(is_visible);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_featured ON public.creator_reels(is_featured);
CREATE INDEX IF NOT EXISTS idx_creator_reels_sort_order ON public.creator_reels(sort_order);

DROP TRIGGER IF EXISTS on_creator_reels_updated ON public.creator_reels;
CREATE TRIGGER on_creator_reels_updated
    BEFORE UPDATE ON public.creator_reels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7b. CAMPAIGNS TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

DROP TRIGGER IF EXISTS on_campaigns_updated ON public.campaigns;
CREATE TRIGGER on_campaigns_updated
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 8. ORDERS & BRIEFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.creator_packages(id) ON DELETE RESTRICT,
    order_status TEXT NOT NULL DEFAULT 'FUNDED' CHECK (
        order_status IN (
            'DRAFT',
            'PAYMENT_PENDING',
            'FUNDED',
            'CREATOR_PENDING',
            'ACCEPTED',
            'IN_PROGRESS',
            'DELIVERED',
            'APPROVED',
            'DISPUTED',
            'ADMIN_REVIEW',
            'REFUND_PENDING',
            'REFUNDED',
            'PAYOUT_PENDING',
            'PAID',
            'CANCELLED',
            'COMPLETED'
        )
    ),
    payment_status TEXT NOT NULL DEFAULT 'FUNDED' CHECK (
        payment_status IN ('PENDING', 'FUNDED', 'REFUNDED', 'FAILED')
    ),
    payout_status TEXT NOT NULL DEFAULT 'UNRELEASED' CHECK (
        payout_status IN ('UNRELEASED', 'PAYOUT_PENDING', 'PAID', 'HELD', 'CANCELLED')
    ),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON public.orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.order_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    requirements TEXT NOT NULL,
    dos TEXT,
    donts TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 9. ORDER EVENTS AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
    from_status TEXT,
    to_status TEXT NOT NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON public.order_events(created_at);

-- ============================================================================
-- 10. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'payment_gateway',
    provider_payment_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'captured', 'refunded', 'failed')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- ============================================================================
-- 11. PAYOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    provider TEXT NOT NULL DEFAULT 'upi_bank_transfer',
    provider_transfer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON public.payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_order_id ON public.payouts(order_id);

-- ============================================================================
-- 12. DELIVERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proof_url TEXT NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'disputed', 'revised'))
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);

-- ============================================================================
-- 13. DISPUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Didn''t follow brief', 'Wrong content', 'Late delivery', 'Didn''t publish', 'Other')),
    description TEXT NOT NULL,
    evidence_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
    resolution TEXT CHECK (resolution IN ('release_payment', 'refund_business', 'partial_resolve', 'cancelled')),
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);

-- ============================================================================
-- 14. CONVERSATIONS & MESSAGES TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    moderation_status TEXT NOT NULL DEFAULT 'clean' CHECK (moderation_status IN ('clean', 'flagged', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================================================
-- 15. ADMIN ACTIONS AUDIT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- ============================================================================
-- 16. SUPABASE STORAGE BUCKETS SETUP
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'creator-reels',
        'creator-reels',
        true,
        19922944, -- 19 MB maximum file size limit
        ARRAY['video/mp4', 'video/webm', 'video/quicktime']
    ),
    (
        'creator-profiles',
        'creator-profiles',
        true,
        5242880, -- 5 MB maximum file size limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'business-logos',
        'business-logos',
        true,
        5242880, -- 5 MB maximum file size limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Creator Profiles Policies
DROP POLICY IF EXISTS "Creator profiles are viewable by everyone" ON public.creator_profiles;
CREATE POLICY "Creator profiles are viewable by everyone"
    ON public.creator_profiles FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Creators can insert own creator profile" ON public.creator_profiles;
CREATE POLICY "Creators can insert own creator profile"
    ON public.creator_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can update own creator profile" ON public.creator_profiles;
CREATE POLICY "Creators can update own creator profile"
    ON public.creator_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- 3. Creator Samples Policies
DROP POLICY IF EXISTS "Samples are viewable by everyone" ON public.creator_samples;
CREATE POLICY "Samples are viewable by everyone"
    ON public.creator_samples FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Creators can manage own samples" ON public.creator_samples;
CREATE POLICY "Creators can manage own samples"
    ON public.creator_samples FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 4. Business Profiles Policies
DROP POLICY IF EXISTS "Business profiles are viewable by authenticated users" ON public.business_profiles;
CREATE POLICY "Business profiles are viewable by authenticated users"
    ON public.business_profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Businesses can insert own business profile" ON public.business_profiles;
CREATE POLICY "Businesses can insert own business profile"
    ON public.business_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can update own business profile" ON public.business_profiles;
CREATE POLICY "Businesses can update own business profile"
    ON public.business_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- 4b. Campaigns Policies
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

-- 5. Creator Packages Policies
DROP POLICY IF EXISTS "Active packages are viewable by everyone" ON public.creator_packages;
CREATE POLICY "Active packages are viewable by everyone"
    ON public.creator_packages FOR SELECT
    TO anon, authenticated
    USING (active = true OR is_active = true OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can manage own packages" ON public.creator_packages;
CREATE POLICY "Creators can manage own packages"
    ON public.creator_packages FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 6. Creator Reels Policies
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

-- 7. Orders & Briefs Policies
DROP POLICY IF EXISTS "Users can view orders they are involved in" ON public.orders;
CREATE POLICY "Users can view orders they are involved in"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = business_id OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can create orders" ON public.orders;
CREATE POLICY "Businesses can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = business_id OR public.is_admin());

DROP POLICY IF EXISTS "Involved parties can update orders" ON public.orders;
CREATE POLICY "Involved parties can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_id OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Order briefs are viewable by involved users" ON public.order_briefs;
CREATE POLICY "Order briefs are viewable by involved users"
    ON public.order_briefs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Businesses can insert order briefs" ON public.order_briefs;
CREATE POLICY "Businesses can insert order briefs"
    ON public.order_briefs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND (orders.business_id = auth.uid() OR public.is_admin())
        )
    );

-- 8. Order Events Policies
DROP POLICY IF EXISTS "Order events viewable by involved users" ON public.order_events;
CREATE POLICY "Order events viewable by involved users"
    ON public.order_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_events.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert order events" ON public.order_events;
CREATE POLICY "Authenticated users can insert order events"
    ON public.order_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id OR public.is_admin());

-- 9. Payments Policies
DROP POLICY IF EXISTS "Users can view payments for their orders" ON public.payments;
CREATE POLICY "Users can view payments for their orders"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 10. Payouts Policies
DROP POLICY IF EXISTS "Creators can view their own payouts" ON public.payouts;
CREATE POLICY "Creators can view their own payouts"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 11. Deliveries Policies
DROP POLICY IF EXISTS "Deliveries viewable by involved parties" ON public.deliveries;
CREATE POLICY "Deliveries viewable by involved parties"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = deliveries.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Creators can insert deliveries" ON public.deliveries;
CREATE POLICY "Creators can insert deliveries"
    ON public.deliveries FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = deliveries.order_id
            AND (orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 12. Disputes Policies
DROP POLICY IF EXISTS "Disputes viewable by involved parties" ON public.disputes;
CREATE POLICY "Disputes viewable by involved parties"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = disputes.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Involved parties can open disputes" ON public.disputes;
CREATE POLICY "Involved parties can open disputes"
    ON public.disputes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = disputes.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 13. Conversations & Messages Policies
DROP POLICY IF EXISTS "Conversations viewable by involved parties" ON public.conversations;
CREATE POLICY "Conversations viewable by involved parties"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = conversations.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
CREATE POLICY "Messages viewable by conversation participants"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            JOIN public.orders ON orders.id = conversations.order_id
            WHERE conversations.id = messages.conversation_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            JOIN public.orders ON orders.id = conversations.order_id
            WHERE conversations.id = messages.conversation_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 14. Admin Actions Policies
DROP POLICY IF EXISTS "Only admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Only admins can view admin actions"
    ON public.admin_actions FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can record actions" ON public.admin_actions;
CREATE POLICY "Only admins can record actions"
    ON public.admin_actions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 18. STORAGE POLICIES
-- ============================================================================

-- creator-reels storage policies
DROP POLICY IF EXISTS "Public access to creator reels" ON storage.objects;
CREATE POLICY "Public access to creator reels"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'creator-reels');

DROP POLICY IF EXISTS "Authenticated creators can upload reels" ON storage.objects;
CREATE POLICY "Authenticated creators can upload reels"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Creators can update own reels" ON storage.objects;
CREATE POLICY "Creators can update own reels"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Creators can delete own reels" ON storage.objects;
CREATE POLICY "Creators can delete own reels"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- creator-profiles storage policies
DROP POLICY IF EXISTS "Public access to creator profiles" ON storage.objects;
CREATE POLICY "Public access to creator profiles"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'creator-profiles');

DROP POLICY IF EXISTS "Authenticated users can upload own profile picture" ON storage.objects;
CREATE POLICY "Authenticated users can upload own profile picture"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'creator-profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- business-logos storage policies
DROP POLICY IF EXISTS "Public access to business logos" ON storage.objects;
CREATE POLICY "Public access to business logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Authenticated businesses can upload logos" ON storage.objects;
CREATE POLICY "Authenticated businesses can upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'business-logos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
