-- ============================================================================
-- 037_creator_upi_payout_and_workflow_simplification.sql
-- Simplifies Creator Payouts to UPI (VPA) and removes bank account friction
-- ============================================================================

-- 1. Ensure payout_upi_id exists on public.creator_payout_profiles
ALTER TABLE public.creator_payout_profiles
    ADD COLUMN IF NOT EXISTS payout_upi_id TEXT;

-- 2. Drop the restrictive trigger on collaboration_requests
-- Chat & collaboration requests should never be blocked by payout setup.
DROP TRIGGER IF EXISTS trg_check_creator_payout_collaboration_requests ON public.collaboration_requests;

-- 3. Sync existing UPI IDs and update status to VERIFIED
UPDATE public.creator_payout_profiles cp
SET 
    payout_upi_id = COALESCE(cp.payout_upi_id, c.payout_upi_id),
    verification_status = CASE 
        WHEN COALESCE(cp.payout_upi_id, c.payout_upi_id) IS NOT NULL THEN 'VERIFIED'
        ELSE cp.verification_status 
    END,
    updated_at = NOW()
FROM public.creator_profiles c
WHERE cp.user_id = c.id;

-- Reset any REJECTED statuses to VERIFIED if a vendor or upi id exists
UPDATE public.creator_payout_profiles
SET 
    verification_status = 'VERIFIED',
    updated_at = NOW()
WHERE (cashfree_vendor_id IS NOT NULL OR payout_upi_id IS NOT NULL);

-- 4. Clean up all previous overloaded signatures of accept_deal_proposal to prevent ambiguity
DROP FUNCTION IF EXISTS public.accept_deal_proposal(UUID);
DROP FUNCTION IF EXISTS public.accept_deal_proposal(UUID, NUMERIC);

-- 5. Create canonical public.accept_deal_proposal
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
