-- ============================================================================
-- 029_instagram_creator_integration.sql
-- Add Instagram verified account fields & reel embed support
-- ============================================================================

-- 1. Safely add Instagram fields to public.creator_profiles if they do not exist
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS instagram_username TEXT,
ADD COLUMN IF NOT EXISTS instagram_profile_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS instagram_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_access_token TEXT;

COMMENT ON COLUMN public.creator_profiles.instagram_username IS
'Verified Instagram username obtained via Meta Graph API OAuth. Never fabricated.';

COMMENT ON COLUMN public.creator_profiles.instagram_access_token IS
'Server-side OAuth access token for creator Instagram Graph API. Strictly private, never returned in public discovery queries.';

COMMENT ON COLUMN public.creator_profiles.instagram_profile_data IS
'Raw verified profile metadata from Meta Graph API (account_type, media_count, etc.).';

-- 2. Safely add Instagram Reel support columns to public.creator_reels
ALTER TABLE public.creator_reels
ADD COLUMN IF NOT EXISTS instagram_media_id TEXT,
ADD COLUMN IF NOT EXISTS reel_url TEXT;

COMMENT ON COLUMN public.creator_reels.instagram_media_id IS
'Instagram Reel shortcode or media identifier (e.g. C8xYz12345).';

COMMENT ON COLUMN public.creator_reels.reel_url IS
'Direct Instagram Reel link (https://www.instagram.com/reel/...) for client-side embedding.';

-- 3. Secure helper RPC for creator to connect or update their Instagram profile data
-- Handles both existing creator profiles and onboarding state idempotently
CREATE OR REPLACE FUNCTION public.save_creator_instagram_connection(
    p_user_id UUID,
    p_instagram_user_id TEXT,
    p_instagram_username TEXT,
    p_follower_count INTEGER,
    p_profile_data JSONB,
    p_access_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    INSERT INTO public.creator_profiles (
        user_id,
        instagram_connected,
        instagram_verified,
        instagram_user_id,
        instagram_username,
        follower_count,
        metrics_source,
        metrics_verified_at,
        instagram_connected_at,
        instagram_profile_data,
        instagram_access_token,
        updated_at
    )
    VALUES (
        p_user_id,
        true,
        true,
        p_instagram_user_id,
        p_instagram_username,
        COALESCE(p_follower_count, 0),
        'instagram_meta_verified',
        v_now,
        v_now,
        COALESCE(p_profile_data, '{}'::jsonb),
        p_access_token,
        v_now
    )
    ON CONFLICT (user_id) DO UPDATE SET
        instagram_connected = true,
        instagram_verified = true,
        instagram_user_id = EXCLUDED.instagram_user_id,
        instagram_username = EXCLUDED.instagram_username,
        follower_count = CASE 
            WHEN p_follower_count IS NOT NULL AND p_follower_count > 0 THEN p_follower_count 
            ELSE public.creator_profiles.follower_count 
        END,
        metrics_source = 'instagram_meta_verified',
        metrics_verified_at = v_now,
        instagram_connected_at = v_now,
        instagram_profile_data = EXCLUDED.instagram_profile_data,
        instagram_access_token = COALESCE(EXCLUDED.instagram_access_token, public.creator_profiles.instagram_access_token),
        updated_at = v_now;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'instagram_username', p_instagram_username,
        'follower_count', p_follower_count,
        'connected_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_creator_instagram_connection TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_creator_instagram_connection TO service_role;

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
