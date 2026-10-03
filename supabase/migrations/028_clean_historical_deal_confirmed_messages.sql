-- ============================================================================
-- 028_clean_historical_deal_confirmed_messages.sql
-- Fix historical "Deal Confirmed" system message to describe the event without
-- baking in a mutable status string "(Status: Deal Confirmed - Payment Pending)".
-- ============================================================================

-- 1. Update accept_deal_proposal to create clean event message
CREATE OR REPLACE FUNCTION public.accept_deal_proposal(p_proposal_id UUID)
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
    v_total_amount NUMERIC(10,2);
    v_platform_fee NUMERIC(10,2);
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

    -- Security: Only the other party (recipient) can accept the proposal
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

    -- Generate Order Number
    v_order_number := 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    v_platform_fee := ROUND(v_proposal.price * 0.05, 2);
    v_total_amount := v_proposal.price + v_platform_fee;

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
        deadline,
        included_revisions,
        revisions_used,
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
        v_proposal.price,
        v_platform_fee,
        v_total_amount,
        v_proposal.deadline,
        COALESCE(v_proposal.revisions_included, 1),
        0,
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

    -- Insert historical system message describing the event that happened
    INSERT INTO public.messages (
        conversation_id,
        order_id,
        sender_id,
        sender_user_id,
        sender_role,
        body,
        message,
        moderation_status,
        created_at
    ) VALUES (
        v_conv.id,
        v_order_id,
        v_caller_id,
        v_caller_id,
        CASE WHEN v_caller_id = v_conv.business_user_id THEN 'business' ELSE 'creator' END,
        '✓ Deal confirmed! Agreed deliverable: ' || v_proposal.deliverable || ' for ₹' || v_proposal.price || '. Order #' || v_order_number || ' created.',
        '✓ Deal confirmed! Agreed deliverable: ' || v_proposal.deliverable || ' for ₹' || v_proposal.price || '. Order #' || v_order_number || ' created.',
        'clean',
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'order_status', 'DEAL_CONFIRMED',
        'total_amount', v_total_amount,
        'included_revisions', COALESCE(v_proposal.revisions_included, 1)
    );
END;
$$;

-- 2. Cleanup existing historical messages without altering order/payment state
UPDATE public.messages
SET
    body = REPLACE(body, ' (Status: Deal Confirmed - Payment Pending)', '.'),
    message = REPLACE(message, ' (Status: Deal Confirmed - Payment Pending)', '.')
WHERE body LIKE '%(Status: Deal Confirmed - Payment Pending)%'
   OR message LIKE '%(Status: Deal Confirmed - Payment Pending)%';

-- Fix double periods if any resulted from replace
UPDATE public.messages
SET
    body = REPLACE(body, '..', '.'),
    message = REPLACE(message, '..', '.')
WHERE body LIKE '%..'
   OR message LIKE '%..';
