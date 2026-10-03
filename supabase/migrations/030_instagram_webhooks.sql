-- ============================================================================
-- 030_instagram_webhooks.sql
-- Instagram Webhook Event Logging, Profile Sync Status & Security
-- ============================================================================

-- 1. Safely add webhook sync & status tracking columns to public.creator_profiles
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS instagram_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_sync_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS instagram_webhook_received_at TIMESTAMPTZ;

COMMENT ON COLUMN public.creator_profiles.instagram_last_synced_at IS
'Timestamp of the most recent successful server-side Instagram profile/metric sync.';

COMMENT ON COLUMN public.creator_profiles.instagram_sync_status IS
'Status of Instagram connection sync (active, disconnected, error, pending).';

COMMENT ON COLUMN public.creator_profiles.instagram_webhook_received_at IS
'Timestamp of the latest Meta Instagram webhook notification received for this account.';

-- 2. Create Instagram Webhook Events Audit / Ingestion Table
CREATE TABLE IF NOT EXISTS public.instagram_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE,
    object_type TEXT NOT NULL DEFAULT 'instagram',
    instagram_account_id TEXT,
    field_name TEXT,
    payload_summary JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_instagram_webhook_events_account_id 
    ON public.instagram_webhook_events(instagram_account_id);

CREATE INDEX IF NOT EXISTS idx_instagram_webhook_events_status 
    ON public.instagram_webhook_events(status);

CREATE INDEX IF NOT EXISTS idx_instagram_webhook_events_created_at 
    ON public.instagram_webhook_events(created_at DESC);

-- 3. Row Level Security (RLS) for Webhook Events
-- Strictly private: Only service_role and platform admins can access webhook audit logs.
-- Never exposed to anonymous or regular authenticated clients.
ALTER TABLE public.instagram_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Webhook events are viewable only by admins" ON public.instagram_webhook_events;
CREATE POLICY "Webhook events are viewable only by admins"
    ON public.instagram_webhook_events FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Service role has full access to webhook events" ON public.instagram_webhook_events;
CREATE POLICY "Service role has full access to webhook events"
    ON public.instagram_webhook_events FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Secure Helper Function for Webhook Ingestion
CREATE OR REPLACE FUNCTION public.record_instagram_webhook_event(
    p_event_id TEXT,
    p_object_type TEXT,
    p_account_id TEXT,
    p_field_name TEXT,
    p_summary JSONB,
    p_status TEXT DEFAULT 'processed',
    p_error TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_record_id UUID;
BEGIN
    INSERT INTO public.instagram_webhook_events (
        event_id,
        object_type,
        instagram_account_id,
        field_name,
        payload_summary,
        status,
        error_message,
        processed_at,
        created_at
    )
    VALUES (
        p_event_id,
        COALESCE(p_object_type, 'instagram'),
        p_account_id,
        p_field_name,
        COALESCE(p_summary, '{}'::jsonb),
        COALESCE(p_status, 'processed'),
        p_error,
        v_now,
        v_now
    )
    ON CONFLICT (event_id) DO UPDATE SET
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message,
        processed_at = v_now
    RETURNING id INTO v_record_id;

    -- If account ID matched a creator, update webhook received timestamp
    IF p_account_id IS NOT NULL AND p_account_id <> '' THEN
        UPDATE public.creator_profiles
        SET 
            instagram_webhook_received_at = v_now,
            updated_at = v_now
        WHERE instagram_user_id = p_account_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'event_record_id', v_record_id,
        'account_id', p_account_id,
        'recorded_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_instagram_webhook_event TO service_role;
GRANT EXECUTE ON FUNCTION public.record_instagram_webhook_event TO authenticated;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
