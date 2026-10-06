-- ============================================================================
-- 031_expand_creator_verification_status_check.sql
-- Safely expand creator_profiles verification_status CHECK constraint to support
-- 'verified_oauth' and 'verified_manual' without modifying existing profile data.
-- ============================================================================

-- 1. Safely drop the existing inline CHECK constraint if it exists
ALTER TABLE public.creator_profiles
DROP CONSTRAINT IF EXISTS creator_profiles_verification_status_check;

-- 2. Add the updated CHECK constraint with the full set of valid verification statuses
ALTER TABLE public.creator_profiles
ADD CONSTRAINT creator_profiles_verification_status_check
CHECK (verification_status IN (
    'unverified',
    'pending',
    'verified',
    'verified_manual',
    'verified_oauth',
    'rejected',
    'deleted'
));

-- 3. Update public.save_creator_instagram_connection to explicitly set verification_status = 'verified_oauth'
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
        verification_status,
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
        'verified_oauth',
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
        verification_status = 'verified_oauth',
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
        'verification_status', 'verified_oauth',
        'connected_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_creator_instagram_connection TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_creator_instagram_connection TO service_role;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
