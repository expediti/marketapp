-- ============================================================================
-- 036_creator_payout_setup_and_restrictions.sql
-- Creator Bank Payout Profiles, Encrypted Secrets, and Campaign Restrictions
-- ============================================================================

-- 1. Create public.creator_payout_profiles
CREATE TABLE IF NOT EXISTS public.creator_payout_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_account_last4 VARCHAR(4) NOT NULL,
    ifsc_code TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'SAVINGS' CHECK (account_type IN ('SAVINGS', 'CURRENT')),
    cashfree_vendor_id TEXT,
    verification_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED' CHECK (
        verification_status IN (
            'NOT_CONFIGURED',
            'PENDING_VERIFICATION',
            'VERIFIED',
            'REJECTED',
            'ACTION_REQUIRED'
        )
    ),
    verification_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_creator_payout_profiles_user_id ON public.creator_payout_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_payout_profiles_status ON public.creator_payout_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_creator_payout_profiles_vendor_id ON public.creator_payout_profiles(cashfree_vendor_id);

-- 2. Create public.creator_payout_secrets
-- Strictly isolated table storing AES-256-GCM encrypted bank payload.
-- NEVER accessible to client browser or anon keys.
CREATE TABLE IF NOT EXISTS public.creator_payout_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_payload TEXT NOT NULL,
    key_version TEXT NOT NULL DEFAULT 'v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_creator_payout_secrets_user_id ON public.creator_payout_secrets(user_id);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.creator_payout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payout_secrets ENABLE ROW LEVEL SECURITY;

-- Creators may read their own safe payout status only
DROP POLICY IF EXISTS "Creators can view own payout profile" ON public.creator_payout_profiles;
CREATE POLICY "Creators can view own payout profile"
    ON public.creator_payout_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Do NOT allow browser clients direct INSERT/UPDATE/DELETE on creator_payout_profiles.
-- Users cannot modify their own verification_status or cashfree_vendor_id directly.
-- All mutations must be executed through trusted backend service endpoints.

-- creator_payout_secrets: ZERO client policies (SELECT/INSERT/UPDATE/DELETE).
-- Fully restricted to trusted service_role execution only.

-- 4. Server-Side Campaign Restrictions Trigger for Collaboration Requests
CREATE OR REPLACE FUNCTION public.check_creator_payout_before_campaign_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_vendor_id TEXT;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();

    -- Check if operation is being executed by a creator
    -- Condition A: Creator attempts to send a collaboration request
    IF TG_OP = 'INSERT' AND v_caller_id IS NOT NULL AND v_caller_id = NEW.creator_user_id THEN
        SELECT verification_status, cashfree_vendor_id INTO v_status, v_vendor_id
        FROM public.creator_payout_profiles
        WHERE user_id = NEW.creator_user_id;

        IF v_status IS DISTINCT FROM 'VERIFIED' OR v_vendor_id IS NULL OR TRIM(v_vendor_id) = '' THEN
            RAISE EXCEPTION 'Creator bank payout setup is required before sending a campaign request. Please complete bank verification in Settings → Payouts.';
        END IF;
    END IF;

    -- Condition B: Creator attempts to accept a collaboration request
    IF TG_OP = 'UPDATE' AND NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
        -- Only check if the accepter is the creator
        IF v_caller_id IS NOT NULL AND v_caller_id = NEW.creator_user_id THEN
            SELECT verification_status, cashfree_vendor_id INTO v_status, v_vendor_id
            FROM public.creator_payout_profiles
            WHERE user_id = NEW.creator_user_id;

            IF v_status IS DISTINCT FROM 'VERIFIED' OR v_vendor_id IS NULL OR TRIM(v_vendor_id) = '' THEN
                RAISE EXCEPTION 'Creator bank payout setup is required before accepting a campaign request. Please complete bank verification in Settings → Payouts.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_creator_payout_collaboration_requests ON public.collaboration_requests;
CREATE TRIGGER trg_check_creator_payout_collaboration_requests
    BEFORE INSERT OR UPDATE ON public.collaboration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.check_creator_payout_before_campaign_request();

-- 5. Update public.accept_deal_proposal with Server-Side Creator Payout Verification Check
CREATE OR REPLACE FUNCTION public.accept_deal_proposal(
    p_proposal_id UUID,
    p_commission_percentage NUMERIC DEFAULT 10.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_proposal RECORD;
    v_conv RECORD;
    v_order_id UUID;
    v_order_number TEXT;
    v_campaign_price NUMERIC(10,2);
    v_commission_pct NUMERIC(5,2);
    v_commission_amount NUMERIC(10,2);
    v_creator_total NUMERIC(10,2);
    v_first_instalment NUMERIC(10,2);
    v_second_instalment NUMERIC(10,2);
    v_first_paise BIGINT;
    v_second_paise BIGINT;
    v_payout_status TEXT;
    v_payout_vendor_id TEXT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch the active proposal
    SELECT * INTO v_proposal
    FROM public.deal_proposals
    WHERE id = p_proposal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal proposal not found';
    END IF;

    IF v_proposal.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Deal proposal is not active (status: %)', v_proposal.status;
    END IF;

    -- Fetch conversation
    SELECT * INTO v_conv
    FROM public.conversations
    WHERE id = v_proposal.conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated conversation not found';
    END IF;

    -- Security: Only recipient can accept
    IF v_caller_id = v_proposal.proposed_by THEN
        RAISE EXCEPTION 'You cannot accept your own deal proposal';
    END IF;

    IF v_caller_id != v_conv.business_user_id AND v_caller_id != v_conv.creator_user_id THEN
        RAISE EXCEPTION 'You are not a participant in this conversation';
    END IF;

    -- Server-Side Campaign Deal Restriction:
    -- Verify Creator Payout Profile exists, verification_status is VERIFIED, and Cashfree vendor ID is present
    SELECT verification_status, cashfree_vendor_id 
    INTO v_payout_status, v_payout_vendor_id
    FROM public.creator_payout_profiles
    WHERE user_id = v_conv.creator_user_id;

    IF v_payout_status IS DISTINCT FROM 'VERIFIED' OR v_payout_vendor_id IS NULL OR TRIM(v_payout_vendor_id) = '' THEN
        RAISE EXCEPTION 'Creator bank payout setup is required before confirming a campaign deal. Please complete bank verification in Settings → Payouts.';
    END IF;

    -- Mark proposal accepted
    UPDATE public.deal_proposals
    SET
        status = 'ACCEPTED',
        accepted_at = v_now,
        accepted_by = v_caller_id,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- Supersede any other active proposals in this conversation
    UPDATE public.deal_proposals
    SET
        status = 'SUPERSEDED',
        updated_at = v_now
    WHERE conversation_id = v_proposal.conversation_id
      AND id != p_proposal_id
      AND status = 'ACTIVE';

    -- Financial calculations:
    -- Agreed campaign price
    v_campaign_price := v_proposal.price;
    v_commission_pct := COALESCE(p_commission_percentage, 10.00);
    v_commission_amount := ROUND(v_campaign_price * (v_commission_pct / 100.0), 2);
    v_creator_total := v_campaign_price - v_commission_amount;

    -- Equal 50/50 instalments
    v_first_instalment := ROUND(v_campaign_price * 0.5, 2);
    v_second_instalment := v_campaign_price - v_first_instalment;
    v_first_paise := ROUND(v_first_instalment * 100);
    v_second_paise := ROUND(v_second_instalment * 100);

    -- Generate unique Order Number
    v_order_number := 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

    -- Create canonical Order
    INSERT INTO public.orders (
        order_number,
        business_id,
        business_user_id,
        creator_id,
        creator_user_id,
        request_id,
        package_id,
        order_status,
        payment_status,
        payout_status,
        subtotal,
        platform_fee,
        total_amount,
        first_payment_amount,
        second_payment_amount,
        first_payment_amount_paise,
        second_payment_amount_paise,
        initial_payment_amount,
        final_payment_amount,
        platform_commission_percentage,
        platform_commission_amount,
        creator_total_amount,
        agreed_revision_limit,
        included_revisions,
        revisions_used,
        deadline,
        requirements,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        v_conv.business_user_id,
        v_conv.business_user_id,
        v_conv.creator_user_id,
        v_conv.creator_user_id,
        v_proposal.request_id,
        '00000000-0000-0000-0000-000000000000'::UUID,
        'DEAL_CONFIRMED',
        'PENDING',
        'UNRELEASED',
        v_campaign_price,
        v_commission_amount,
        v_campaign_price,
        v_first_instalment,
        v_second_instalment,
        v_first_paise,
        v_second_paise,
        v_first_instalment,
        v_second_instalment,
        v_commission_pct,
        v_commission_amount,
        v_creator_total,
        COALESCE(v_proposal.revisions_included, 1),
        COALESCE(v_proposal.revisions_included, 1),
        0,
        v_proposal.deadline,
        v_proposal.key_requirements,
        v_now,
        v_now
    )
    RETURNING id INTO v_order_id;

    -- Link order to conversation
    UPDATE public.conversations
    SET
        order_id = v_order_id,
        updated_at = v_now
    WHERE id = v_conv.id;

    -- Link order to proposal
    UPDATE public.deal_proposals
    SET order_id = v_order_id
    WHERE id = p_proposal_id;

    -- Insert order event in audit history
    INSERT INTO public.order_events (
        order_id,
        actor_id,
        event_type,
        from_status,
        to_status,
        reason,
        metadata,
        created_at
    ) VALUES (
        v_order_id,
        v_caller_id,
        'DEAL_CONFIRMED',
        'NEGOTIATING',
        'DEAL_CONFIRMED',
        'Deal confirmed by parties. Campaign amount locked at ₹' || v_campaign_price || ' (2 × ₹' || v_first_instalment || ' instalments). Platform commission ' || v_commission_pct || '%.',
        jsonb_build_object(
            'proposal_id', p_proposal_id,
            'campaign_price', v_campaign_price,
            'first_instalment', v_first_instalment,
            'second_instalment', v_second_instalment,
            'commission_pct', v_commission_pct
        ),
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_campaign_price,
        'first_instalment', v_first_instalment,
        'second_instalment', v_second_instalment,
        'creator_total', v_creator_total,
        'commission_amount', v_commission_amount,
        'included_revisions', COALESCE(v_proposal.revisions_included, 1)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_deal_proposal(UUID, NUMERIC) TO authenticated;

