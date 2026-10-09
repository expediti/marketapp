-- ============================================================================
-- 033_manual_instagram_verification.sql
-- Manual Instagram verification workflow, submitted profile and Reel URLs,
-- admin-reviewed metrics, and audit tracking.
-- ============================================================================

-- 1. Add manual submission and reviewed metrics columns to public.creator_profiles
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS instagram_profile_url TEXT,
ADD COLUMN IF NOT EXISTS submitted_reels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS primary_reel_url TEXT,
ADD COLUMN IF NOT EXISTS claimed_followers INTEGER,
ADD COLUMN IF NOT EXISTS claimed_engagement_rate NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS reviewed_follower_count INTEGER,
ADD COLUMN IF NOT EXISTS reviewed_engagement_rate NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS reviewed_avg_reel_views INTEGER,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Column documentation comments
COMMENT ON COLUMN public.creator_profiles.instagram_profile_url IS 'Creator-submitted public Instagram profile link (https://www.instagram.com/username/).';
COMMENT ON COLUMN public.creator_profiles.submitted_reels IS 'List of creator-submitted Instagram Reel URLs and primary selection metadata.';
COMMENT ON COLUMN public.creator_profiles.primary_reel_url IS 'Designated primary featured Reel URL for portfolio showcase.';
COMMENT ON COLUMN public.creator_profiles.claimed_followers IS 'Self-reported follower count pending manual admin review.';
COMMENT ON COLUMN public.creator_profiles.reviewed_follower_count IS 'Manually observed and verified follower count by authorized platform administrator.';
COMMENT ON COLUMN public.creator_profiles.reviewed_engagement_rate IS 'Reviewed engagement rate verified by platform administrator.';
COMMENT ON COLUMN public.creator_profiles.reviewed_avg_reel_views IS 'Reviewed average Reel video plays/views observed by administrator.';
COMMENT ON COLUMN public.creator_profiles.reviewed_at IS 'Timestamp when administrative verification and metrics observation took place.';
COMMENT ON COLUMN public.creator_profiles.reviewed_by IS 'Profile ID of the administrator who performed the verification review.';
COMMENT ON COLUMN public.creator_profiles.review_notes IS 'Internal administrative notes regarding the verification decision.';

-- 2. Safely expand the verification_status check constraint to include all required manual and legacy states
ALTER TABLE public.creator_profiles
DROP CONSTRAINT IF EXISTS creator_profiles_verification_status_check;

ALTER TABLE public.creator_profiles
ADD CONSTRAINT creator_profiles_verification_status_check
CHECK (verification_status IN (
    'unverified',
    'pending',
    'pending_review',
    'verified',
    'verified_manual',
    'verified_oauth',
    'rejected',
    'resubmission_required',
    'deleted'
));

-- 3. Secure helper RPC for creators to submit/update their profile and Reel URLs for review
-- Automatically transitions status to 'pending_review' without granting self-verification permissions
CREATE OR REPLACE FUNCTION public.submit_creator_manual_verification(
    p_user_id UUID,
    p_profile_url TEXT,
    p_reels JSONB,
    p_primary_reel_url TEXT DEFAULT NULL,
    p_claimed_followers INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_extracted_username TEXT;
BEGIN
    -- Ensure the caller is either the owner or an admin
    IF auth.uid() <> p_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only submit verification for your own account';
    END IF;

    -- Extract username from URL if possible
    IF p_profile_url IS NOT NULL THEN
        v_extracted_username := substring(p_profile_url from 'instagram\.com/([a-zA-Z0-9._]+)');
    END IF;

    UPDATE public.creator_profiles
    SET
        instagram_profile_url = p_profile_url,
        instagram_username = COALESCE(v_extracted_username, instagram_username),
        submitted_reels = COALESCE(p_reels, '[]'::jsonb),
        primary_reel_url = p_primary_reel_url,
        claimed_followers = COALESCE(p_claimed_followers, claimed_followers),
        verification_status = 'pending_review',
        updated_at = v_now
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.creator_profiles (
            user_id,
            instagram_profile_url,
            instagram_username,
            submitted_reels,
            primary_reel_url,
            claimed_followers,
            verification_status,
            metrics_source,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_profile_url,
            v_extracted_username,
            COALESCE(p_reels, '[]'::jsonb),
            p_primary_reel_url,
            p_claimed_followers,
            'pending_review',
            'platform_manual',
            v_now,
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'verification_status', 'pending_review',
        'submitted_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_creator_manual_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_creator_manual_verification TO service_role;

-- 4. Secure RPC for Administrators to verify, reject, or request resubmission
CREATE OR REPLACE FUNCTION public.admin_verify_creator(
    p_creator_id UUID,
    p_status TEXT,
    p_reviewed_followers INTEGER DEFAULT NULL,
    p_reviewed_engagement NUMERIC DEFAULT NULL,
    p_reviewed_views INTEGER DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- Verify the caller is an administrator
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Only platform administrators can verify creators.';
    END IF;

    -- Validate status value
    IF p_status NOT IN ('verified', 'verified_manual', 'rejected', 'resubmission_required', 'unverified', 'pending_review') THEN
        RAISE EXCEPTION 'Invalid verification status: %', p_status;
    END IF;

    UPDATE public.creator_profiles
    SET
        verification_status = p_status,
        instagram_verified = (p_status IN ('verified', 'verified_manual', 'verified_oauth')),
        reviewed_follower_count = p_reviewed_followers,
        reviewed_engagement_rate = p_reviewed_engagement,
        reviewed_avg_reel_views = p_reviewed_views,
        follower_count = CASE
            WHEN p_reviewed_followers IS NOT NULL AND p_reviewed_followers > 0 THEN p_reviewed_followers
            ELSE follower_count
        END,
        engagement_rate = CASE
            WHEN p_reviewed_engagement IS NOT NULL AND p_reviewed_engagement >= 0 THEN p_reviewed_engagement
            ELSE engagement_rate
        END,
        metrics_source = 'platform_manual',
        metrics_verified_at = v_now,
        reviewed_at = v_now,
        reviewed_by = v_admin_id,
        review_notes = p_review_notes,
        updated_at = v_now
    WHERE user_id = p_creator_id;

    -- Insert into admin audit log
    INSERT INTO public.admin_actions (
        admin_id,
        action,
        target_type,
        target_id,
        metadata,
        created_at
    ) VALUES (
        v_admin_id,
        'VERIFY_CREATOR',
        'creator_profile',
        p_creator_id::text,
        jsonb_build_object(
            'new_status', p_status,
            'reviewed_followers', p_reviewed_followers,
            'reviewed_engagement', p_reviewed_engagement,
            'reviewed_views', p_reviewed_views,
            'notes', p_review_notes
        ),
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'creator_id', p_creator_id,
        'verification_status', p_status,
        'reviewed_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_creator TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_creator TO service_role;
