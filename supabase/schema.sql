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
-- 7b. COLLABORATION REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    package_id UUID REFERENCES public.creator_packages(id) ON DELETE SET NULL,
    message TEXT,
    proposed_budget NUMERIC(10, 2) CHECK (proposed_budget IS NULL OR proposed_budget >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_collab_req_business ON public.collaboration_requests(business_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_creator ON public.collaboration_requests(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_campaign ON public.collaboration_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_package ON public.collaboration_requests(package_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_status ON public.collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_collab_req_created_at ON public.collaboration_requests(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_req_active_unique
    ON public.collaboration_requests(business_user_id, creator_user_id, COALESCE(package_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE (status = 'PENDING');

DROP TRIGGER IF EXISTS on_collab_requests_updated ON public.collaboration_requests;
CREATE TRIGGER on_collab_requests_updated
    BEFORE UPDATE ON public.collaboration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 8. ORDERS & BRIEFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    business_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    creator_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.creator_packages(id) ON DELETE RESTRICT,
    order_status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING' CHECK (
        order_status IN (
            'DRAFT',
            'PAYMENT_PENDING',
            'FUNDED',
            'CREATOR_PENDING',
            'ACCEPTED',
            'IN_PROGRESS',
            'WAITING_FOR_BUSINESS',
            'OVERDUE',
            'DELIVERED',
            'REVISION_REQUESTED',
            'APPROVED',
            'AUTO_APPROVED',
            'DISPUTED',
            'SYSTEM_REVIEW',
            'ADMIN_REVIEW',
            'REFUND_PENDING',
            'REFUNDED',
            'PAYOUT_PENDING',
            'PAID',
            'CANCELLED',
            'COMPLETED'
        )
    ),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        payment_status IN ('NOT_REQUIRED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'FUNDED')
    ),
    payout_status TEXT NOT NULL DEFAULT 'UNRELEASED' CHECK (
        payout_status IN ('UNRELEASED', 'PAYOUT_PENDING', 'PAID', 'HELD', 'CANCELLED')
    ),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    included_revisions INTEGER NOT NULL DEFAULT 1,
    revisions_used INTEGER NOT NULL DEFAULT 0,
    delivered_at TIMESTAMPTZ,
    auto_approve_deadline TIMESTAMPTZ,
    waiting_reason TEXT,
    extension_requested_deadline TIMESTAMPTZ,
    extension_reason TEXT,
    extension_status TEXT DEFAULT 'NONE' CHECK (extension_status IN ('NONE', 'REQUESTED', 'ACCEPTED', 'DECLINED')),
    system_review_reason TEXT,
    system_review_description TEXT,
    system_review_evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON public.orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_request_id ON public.orders(request_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_user_id ON public.orders(business_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON public.orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_user_id ON public.orders(creator_user_id);
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
    request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    business_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_user_id ON public.conversations(business_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_user_id ON public.conversations(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON public.conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_request_id_unique ON public.conversations(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_order_id_unique ON public.conversations(order_id) WHERE order_id IS NOT NULL;

DROP TRIGGER IF EXISTS on_conversations_updated ON public.conversations;
CREATE TRIGGER on_conversations_updated
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_role TEXT CHECK (sender_role IS NULL OR sender_role IN ('business', 'creator', 'advertiser', 'influencer', 'admin')),
    body TEXT,
    message TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'clean' CHECK (moderation_status IN ('clean', 'flagged', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
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

-- 12b. Collaboration Requests Policies
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Businesses can view sent requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can view sent requests"
    ON public.collaboration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = business_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can view received requests" ON public.collaboration_requests;
CREATE POLICY "Creators can view received requests"
    ON public.collaboration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = creator_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can create requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can create requests"
    ON public.collaboration_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = business_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators can respond to requests" ON public.collaboration_requests;
CREATE POLICY "Creators can respond to requests"
    ON public.collaboration_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_user_id OR public.is_admin())
    WITH CHECK (auth.uid() = creator_user_id OR public.is_admin());

DROP POLICY IF EXISTS "Businesses can cancel pending requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can cancel pending requests"
    ON public.collaboration_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_user_id AND status = 'PENDING')
    WITH CHECK (auth.uid() = business_user_id);

-- 13. Conversations & Messages Policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations viewable by involved parties" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR (
            order_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.orders o
                WHERE o.id = conversations.order_id
                AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
            )
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Order parties can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (
                c.business_user_id = auth.uid()
                OR c.creator_user_id = auth.uid()
                OR (
                    c.order_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM public.orders o
                        WHERE o.id = c.order_id
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
        )
    );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Order parties can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        (sender_id = auth.uid() OR sender_user_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (
                c.business_user_id = auth.uid()
                OR c.creator_user_id = auth.uid()
                OR (
                    c.order_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM public.orders o
                        WHERE o.id = c.order_id
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
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
-- 18. STORAGE BUCKETS & POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'creator-profiles',
        'creator-profiles',
        true,
        5242880, -- 5 MB
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'business-logos',
        'business-logos',
        true,
        5242880, -- 5 MB
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    ),
    (
        'creator-reels',
        'creator-reels',
        true,
        19922944, -- 19 MB
        ARRAY['video/mp4', 'video/webm', 'video/quicktime']
    ),
    (
        'avatars',
        'avatars',
        true,
        5242880, -- 5 MB
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 1. Public Read Access: Everyone can view avatars, business logos, and creator reels
DROP POLICY IF EXISTS "Public access to creator reels" ON storage.objects;
DROP POLICY IF EXISTS "Public access to creator profiles" ON storage.objects;
DROP POLICY IF EXISTS "Public access to business logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media buckets" ON storage.objects;

CREATE POLICY "Public read access for media buckets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars'));

-- 2. Authenticated Upload Access (INSERT)
DROP POLICY IF EXISTS "Authenticated creators can upload reels" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated businesses can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated user upload for media buckets" ON storage.objects;

CREATE POLICY "Authenticated user upload for media buckets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars')
        AND (
            auth.role() = 'authenticated'
        )
    );

-- 3. Authenticated Update Access (UPDATE for upsert)
DROP POLICY IF EXISTS "Creators can update own reels" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated user update for media buckets" ON storage.objects;

CREATE POLICY "Authenticated user update for media buckets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars')
        AND (
            auth.role() = 'authenticated'
        )
    )
    WITH CHECK (
        bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars')
        AND (
            auth.role() = 'authenticated'
        )
    );

-- 4. Authenticated Delete Access (DELETE)
DROP POLICY IF EXISTS "Creators can delete own reels" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated user delete for media buckets" ON storage.objects;

CREATE POLICY "Authenticated user delete for media buckets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars')
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

-- ============================================================================
-- 19. NOTIFICATIONS TABLE & RLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'NEW_MESSAGE',
            'COLLABORATION_REQUEST',
            'REQUEST_ACCEPTED',
            'REQUEST_DECLINED',
            'ORDER_CREATED',
            'ORDER_DELIVERED',
            'ORDER_APPROVED',
            'PAYMENT_STATUS_CHANGED',
            'SYSTEM'
        )
    ),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Automated trigger: Notify recipient on new message
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_business_id UUID;
    v_creator_id UUID;
    v_recipient_id UUID;
    v_sender_name TEXT;
BEGIN
    SELECT business_user_id, creator_user_id
    INTO v_business_id, v_creator_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;

    IF NEW.sender_user_id = v_business_id OR NEW.sender_id = v_business_id THEN
        v_recipient_id := v_creator_id;
    ELSIF NEW.sender_user_id = v_creator_id OR NEW.sender_id = v_creator_id THEN
        v_recipient_id := v_business_id;
    END IF;

    IF v_recipient_id IS NOT NULL THEN
        SELECT COALESCE(display_name, 'Partner')
        INTO v_sender_name
        FROM public.profiles
        WHERE id = COALESCE(NEW.sender_user_id, NEW.sender_id);

        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_conversation_id,
            related_order_id
        ) VALUES (
            v_recipient_id,
            'NEW_MESSAGE',
            'New message from ' || COALESCE(v_sender_name, 'Partner'),
            COALESCE(SUBSTRING(COALESCE(NEW.body, NEW.message) FROM 1 FOR 120), 'You received a new message.'),
            NEW.conversation_id,
            NEW.order_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created_notify ON public.messages;
CREATE TRIGGER on_message_created_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_notification();

-- Full replica identity for realtime streaming
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_requests REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Maintain delivered_at, auto_approve_deadline (4 days), and revision counters
CREATE OR REPLACE FUNCTION public.handle_order_delivery_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.order_status = 'DELIVERED' AND (OLD.order_status IS DISTINCT FROM 'DELIVERED') THEN
        NEW.delivered_at := COALESCE(NEW.delivered_at, NOW());
        NEW.auto_approve_deadline := NOW() + INTERVAL '4 days';
    END IF;

    IF NEW.order_status = 'REVISION_REQUESTED' AND (OLD.order_status IS DISTINCT FROM 'REVISION_REQUESTED') THEN
        NEW.revisions_used := COALESCE(OLD.revisions_used, 0) + 1;
        NEW.auto_approve_deadline := NULL;
    END IF;

    IF NEW.order_status IN ('APPROVED', 'AUTO_APPROVED', 'DISPUTED', 'SYSTEM_REVIEW', 'COMPLETED', 'CANCELLED') THEN
        NEW.auto_approve_deadline := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_delivery_workflow ON public.orders;
CREATE TRIGGER trg_order_delivery_workflow
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_delivery_workflow();

-- Server-side auto-approval function (can be triggered by cron or on order query)
CREATE OR REPLACE FUNCTION public.process_auto_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
BEGIN
    FOR r IN
        SELECT id, subtotal, business_user_id, creator_user_id, order_number
        FROM public.orders
        WHERE order_status = 'DELIVERED'
          AND auto_approve_deadline IS NOT NULL
          AND auto_approve_deadline <= NOW()
    LOOP
        UPDATE public.orders
        SET order_status = 'AUTO_APPROVED',
            payout_status = 'PAYOUT_PENDING',
            auto_approve_deadline = NULL,
            updated_at = NOW()
        WHERE id = r.id;

        INSERT INTO public.order_events (
            order_id,
            from_status,
            to_status,
            actor_id,
            reason,
            created_at
        ) VALUES (
            r.id,
            'DELIVERED',
            'AUTO_APPROVED',
            NULL,
            'Automatically approved after 4-day business review window elapsed without revision request or dispute.',
            NOW()
        );

        IF r.creator_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                order_id,
                type,
                title,
                content,
                created_at
            ) VALUES (
                r.creator_user_id,
                r.id,
                'order_status',
                'Delivery Auto-Approved',
                'Order #' || r.order_number || ' has been automatically approved after 4 days of review. Payout is now eligible.',
                NOW()
            );
        END IF;

        IF r.business_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                order_id,
                type,
                title,
                content,
                created_at
            ) VALUES (
                r.business_user_id,
                r.id,
                'order_status',
                'Delivery Auto-Approved',
                'Order #' || r.order_number || ' was automatically approved following the conclusion of the 4-day review period.',
                NOW()
            );
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_auto_approvals() TO authenticated, anon;

-- Deliveries, disputes, and order events RLS
DROP POLICY IF EXISTS "Order parties can view deliveries" ON public.deliveries;
CREATE POLICY "Order parties can view deliveries"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Creators can submit deliveries" ON public.deliveries;
CREATE POLICY "Creators can submit deliveries"
    ON public.deliveries FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties and admin can view disputes" ON public.disputes;
CREATE POLICY "Order parties and admin can view disputes"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = disputes.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can open disputes" ON public.disputes;
CREATE POLICY "Order parties can open disputes"
    ON public.disputes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = disputes.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can view order events" ON public.order_events;
CREATE POLICY "Order parties can view order events"
    ON public.order_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can insert order events" ON public.order_events;
CREATE POLICY "Order parties can insert order events"
    ON public.order_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ============================================================================
-- 19. DEAL PROPOSALS TABLE & WORKFLOW
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deal_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    proposed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deliverable TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    revisions_included INTEGER NOT NULL DEFAULT 1 CHECK (revisions_included >= 0),
    key_requirements TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACCEPTED', 'SUPERSEDED', 'DECLINED', 'CANCELLED')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    supersedes_proposal_id UUID REFERENCES public.deal_proposals(id) ON DELETE SET NULL,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_proposals_conversation_id ON public.deal_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_request_id ON public.deal_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_order_id ON public.deal_proposals(order_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_status ON public.deal_proposals(status);

ALTER TABLE public.deal_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can view deal proposals"
    ON public.deal_proposals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
        OR proposed_by = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can create deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can create deal proposals"
    ON public.deal_proposals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = proposed_by
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Participants can update deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can update deal proposals"
    ON public.deal_proposals FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
        OR proposed_by = auth.uid()
        OR public.is_admin()
    );

ALTER TABLE public.deal_proposals REPLICA IDENTITY FULL;
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_proposals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


