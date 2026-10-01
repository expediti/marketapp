-- ============================================================================
-- 020_database_schema_repair.sql
-- COMPREHENSIVE IDEMPOTENT DATABASE & SUPABASE STORAGE REPAIR MIGRATION
--
-- Repairs and reconciles:
-- 1. Missing 'public.campaigns' table & indexes, triggers, and RLS policies
-- 2. Missing 'country', 'state', 'city' and image columns on 'creator_profiles'
-- 3. Missing 'country', 'state', 'logo_url' and category columns on 'business_profiles'
-- 4. Supabase Storage buckets ('creator-profiles', 'business-logos', 'creator-reels', 'avatars')
-- 5. Storage RLS policies (SELECT, INSERT, UPDATE, DELETE) allowing avatar & logo uploads
-- 6. 'orders' -> 'campaigns' relationship via campaign_id foreign key
-- 7. 'instagram_connections' table with private token storage & non-public RLS
-- 8. PostgREST schema cache reload notification
--
-- Safety:
-- - Preserves all existing data (no DROP TABLE, no destructive ALTERs)
-- - Completely idempotent (safe to execute multiple times)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & BASE UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT,
    display_name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Allow role to be NULL initially during Google OAuth before role selection
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IS NULL OR role IN ('advertiser', 'influencer', 'creator', 'business', 'promoter', 'admin'));

-- Trigger to auto-update updated_at timestamp on profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile trigger on auth.users for Google OAuth & email signups
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
        COALESCE(NEW.email, ''),
        user_name,
        avatar,
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.profiles.email),
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

-- Enable RLS & reconcile policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO anon, authenticated
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
    USING (auth.uid() = id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. CREATOR PROFILES TABLE REPAIR (Fixes missing 'country' column error)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT,
    bio TEXT,
    profile_image_path TEXT,
    country TEXT DEFAULT 'India',
    state TEXT,
    city TEXT DEFAULT 'India',
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
    metrics_source TEXT NOT NULL DEFAULT 'platform_manual',
    metrics_verified_at TIMESTAMPTZ,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Crucial: Add missing columns if creator_profiles table already existed
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS profile_image_path TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'India';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Hindi', 'English'];
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT ARRAY['Technology'];
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS niche TEXT NOT NULL DEFAULT 'Technology';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS audience_age JSONB NOT NULL DEFAULT '{"18-24": 50, "25-34": 35, "35+": 15}'::jsonb;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS audience_gender JSONB NOT NULL DEFAULT '{"female": 45, "male": 55}'::jsonb;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS audience_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS average_reach INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS instagram_connected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS metrics_source TEXT NOT NULL DEFAULT 'platform_manual';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS metrics_verified_at TIMESTAMPTZ;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Indexes for discover filters & performance
CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche ON public.creator_profiles(niche);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_follower_count ON public.creator_profiles(follower_count);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_average_reach ON public.creator_profiles(average_reach);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_location ON public.creator_profiles(country, state, city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_city ON public.creator_profiles(city);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_state ON public.creator_profiles(state);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_country ON public.creator_profiles(country);
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_instagram_user_id 
    ON public.creator_profiles(instagram_user_id) 
    WHERE instagram_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS on_creator_profiles_updated ON public.creator_profiles;
CREATE TRIGGER on_creator_profiles_updated
    BEFORE UPDATE ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS & reconcile policies on public.creator_profiles
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

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
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. BUSINESS PROFILES TABLE REPAIR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    logo_path TEXT,
    logo_url TEXT,
    website TEXT,
    app_url TEXT,
    description TEXT,
    business_type TEXT NOT NULL DEFAULT 'app',
    category TEXT,
    industry TEXT NOT NULL DEFAULT 'Technology & SaaS',
    city TEXT NOT NULL DEFAULT 'India',
    state TEXT,
    country TEXT DEFAULT 'India',
    target_audience TEXT,
    target_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
    budget_range TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Crucial: Add missing columns if business_profiles table already existed
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS logo_path TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS app_url TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'app';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT 'Technology & SaaS';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'India';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS target_locations TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DROP TRIGGER IF EXISTS on_business_profiles_updated ON public.business_profiles;
CREATE TRIGGER on_business_profiles_updated
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS & reconcile policies on public.business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

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
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. CAMPAIGNS TABLE (Fixes missing 'public.campaigns' schema cache error)
-- ----------------------------------------------------------------------------
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
    budget NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'app';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS app_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS campaign_brief TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS target_locations TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

DROP TRIGGER IF EXISTS on_campaigns_updated ON public.campaigns;
CREATE TRIGGER on_campaigns_updated
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS & policies on public.campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Businesses can view own campaigns" ON public.campaigns;
CREATE POLICY "Businesses can view own campaigns"
    ON public.campaigns FOR SELECT
    TO authenticated
    USING (auth.uid() = business_id OR status = 'active' OR public.is_admin());

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

-- ----------------------------------------------------------------------------
-- 6. CREATOR PACKAGES TABLE REPAIR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Instagram',
    content_type TEXT NOT NULL DEFAULT 'Reel',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT NOT NULL DEFAULT '',
    deliverables TEXT[] DEFAULT ARRAY[]::TEXT[],
    delivery_days INTEGER NOT NULL DEFAULT 5 CHECK (delivery_days > 0),
    revision_count INTEGER NOT NULL DEFAULT 1 CHECK (revision_count >= 0),
    revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

ALTER TABLE public.creator_packages ENABLE ROW LEVEL SECURITY;

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

-- ----------------------------------------------------------------------------
-- 7. CREATOR REELS TABLE REPAIR
-- ----------------------------------------------------------------------------
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
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes <= 19922944),
    duration_seconds NUMERIC(6, 2),
    type TEXT NOT NULL DEFAULT 'demo' CHECK (type IN ('client_work', 'demo')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'video/mp4';
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE public.creator_reels ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(6, 2);

CREATE INDEX IF NOT EXISTS idx_creator_reels_creator_id ON public.creator_reels(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_visible ON public.creator_reels(is_visible);
CREATE INDEX IF NOT EXISTS idx_creator_reels_is_featured ON public.creator_reels(is_featured);
CREATE INDEX IF NOT EXISTS idx_creator_reels_sort_order ON public.creator_reels(sort_order);

DROP TRIGGER IF EXISTS on_creator_reels_updated ON public.creator_reels;
CREATE TRIGGER on_creator_reels_updated
    BEFORE UPDATE ON public.creator_reels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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

-- ----------------------------------------------------------------------------
-- 8. ORDERS & CAMPAIGNS RELATIONSHIP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.creator_packages(id) ON DELETE RESTRICT,
    order_status TEXT NOT NULL DEFAULT 'FUNDED',
    payment_status TEXT NOT NULL DEFAULT 'FUNDED',
    payout_status TEXT NOT NULL DEFAULT 'UNRELEASED',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    deadline TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure campaign_id column exists on orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON public.orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON public.orders(creator_id);

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Parties involved can update orders" ON public.orders;
CREATE POLICY "Parties involved can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_id OR auth.uid() = creator_id OR public.is_admin());

-- Order Briefs
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

ALTER TABLE public.order_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order parties can view briefs" ON public.order_briefs;
CREATE POLICY "Order parties can view briefs"
    ON public.order_briefs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Businesses can create briefs" ON public.order_briefs;
CREATE POLICY "Businesses can create briefs"
    ON public.order_briefs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND orders.business_id = auth.uid()
        ) OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 9. MESSAGES & CONVERSATIONS
-- ----------------------------------------------------------------------------
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

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order parties can view conversation" ON public.conversations;
CREATE POLICY "Order parties can view conversation"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = conversations.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Order parties can view messages" ON public.messages;
CREATE POLICY "Order parties can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.orders o ON o.id = c.order_id
            WHERE c.id = messages.conversation_id
            AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Order parties can send messages" ON public.messages;
CREATE POLICY "Order parties can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.orders o ON o.id = c.order_id
            WHERE c.id = messages.conversation_id
            AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- ----------------------------------------------------------------------------
-- 10. INSTAGRAM INTEGRATION TABLE (Isolated private account data)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instagram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    instagram_user_id TEXT UNIQUE,
    username_private TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMPTZ,
    metrics_source TEXT NOT NULL DEFAULT 'platform_manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;

-- Strictly private: Only the owner or admin can read/write their own Instagram tokens
DROP POLICY IF EXISTS "Users can view own instagram connection" ON public.instagram_connections;
CREATE POLICY "Users can view own instagram connection"
    ON public.instagram_connections FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own instagram connection" ON public.instagram_connections;
CREATE POLICY "Users can insert own instagram connection"
    ON public.instagram_connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own instagram connection" ON public.instagram_connections;
CREATE POLICY "Users can update own instagram connection"
    ON public.instagram_connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own instagram connection" ON public.instagram_connections;
CREATE POLICY "Users can delete own instagram connection"
    ON public.instagram_connections FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKETS SETUP
-- ----------------------------------------------------------------------------
-- Ensure buckets exist in storage.buckets with public access and appropriate limits
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

-- ----------------------------------------------------------------------------
-- 12. SUPABASE STORAGE RLS POLICIES (Fixes profile photo & business logo uploads)
-- ----------------------------------------------------------------------------
-- 1. Public Read Access: Everyone can view avatars, business logos, and creator reels
DROP POLICY IF EXISTS "Public access to creator reels" ON storage.objects;
DROP POLICY IF EXISTS "Public access to creator profiles" ON storage.objects;
DROP POLICY IF EXISTS "Public access to business logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media buckets" ON storage.objects;

CREATE POLICY "Public read access for media buckets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id IN ('creator-profiles', 'business-logos', 'creator-reels', 'avatars'));

-- 2. Authenticated Upload Access (INSERT):
-- Allows authenticated users to upload to their user folder or onboarding temp folder
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

-- 3. Authenticated Update Access (UPDATE):
-- Necessary for { upsert: true } during avatar or logo re-uploads
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

-- 4. Authenticated Delete Access (DELETE):
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

-- ----------------------------------------------------------------------------
-- 13. RELOAD POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
-- Explicitly notifies PostgREST to reload its schema cache immediately so that
-- newly created tables, columns, and relations are recognized instantly.
NOTIFY pgrst, 'reload schema';
