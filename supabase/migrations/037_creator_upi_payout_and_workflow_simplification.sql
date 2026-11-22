-- ============================================================================
-- 037_creator_upi_payout_and_workflow_simplification.sql
-- Complete Fix: Orders Schema, Two-Stage Instalments, UPI Payouts & Clean accept_deal_proposal
-- ============================================================================

-- 1. Extend public.orders with Two-Instalment, Commission & Workflow Columns
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS first_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS second_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS first_payment_amount_paise BIGINT,
    ADD COLUMN IF NOT EXISTS second_payment_amount_paise BIGINT,
    ADD COLUMN IF NOT EXISTS initial_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS final_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS platform_commission_percentage NUMERIC(5, 2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS platform_commission_amount NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS creator_total_amount NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agreed_revision_limit INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS initial_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_preview_id UUID,
    ADD COLUMN IF NOT EXISTS current_final_delivery_id UUID,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Allow custom negotiation orders without requiring a package_id
ALTER TABLE public.orders ALTER COLUMN package_id DROP NOT NULL;

-- Update orders_order_status_check constraint to support all workflow statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
        'REQUESTED',
        'NEGOTIATING',
        'DEAL_CONFIRMED',
        'AWAITING_FIRST_PAYMENT',
        'FIRST_PAYMENT_PENDING',
        'FIRST_PAID',
        'PAID',
        'WORK_STARTED',
        'IN_PROGRESS',
        'PREVIEW_SUBMITTED',
        'REVISION_REQUESTED',
        'AWAITING_FINAL_PAYMENT',
        'FINAL_PAYMENT_PENDING',
        'READY_FOR_FINAL_DELIVERY',
        'READY_TO_PUBLISH',
        'DELIVERED',
        'FINAL_DELIVERED',
        'APPROVED',
        'AUTO_APPROVED',
        'DISPUTED',
        'SYSTEM_REVIEW',
        'ADMIN_REVIEW',
        'PAYOUT_PENDING',
        'CANCELLED',
        'COMPLETED',
        'REFUND_PENDING',
        'REFUNDED',
        'DRAFT',
        'PAYMENT_PENDING',
        'FUNDED',
        'CREATOR_PENDING',
        'ACCEPTED',
        'WAITING_FOR_BUSINESS',
        'OVERDUE',
        'PAID_IN_ESCROW',
        'ACCEPTED_AWAITING_PAYMENT'
    )
);

-- 2. Extend public.payments table for two-stage tracking
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS instalment_type TEXT DEFAULT 'INITIAL',
    ADD COLUMN IF NOT EXISTS amount_in_paise BIGINT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provider_order_id TEXT;

-- 3. Create public.campaign_splits table if not exists
CREATE TABLE IF NOT EXISTS public.campaign_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    instalment_type TEXT NOT NULL CHECK (instalment_type IN ('INITIAL', 'FINAL')),
    vendor_id TEXT NOT NULL,
    vendor_role TEXT NOT NULL CHECK (vendor_role IN ('creator', 'platform')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    amount_in_paise BIGINT NOT NULL CHECK (amount_in_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    split_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (split_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    provider_split_reference TEXT,
    settlement_status TEXT NOT NULL DEFAULT 'UNSETTLED' CHECK (settlement_status IN ('UNSETTLED', 'SETTLED', 'FAILED', 'ON_HOLD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create public.campaign_previews if not exists
CREATE TABLE IF NOT EXISTS public.campaign_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    preview_version INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    is_watermarked BOOLEAN NOT NULL DEFAULT true,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '24 hours'),
    preview_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (preview_status IN ('ACTIVE', 'APPROVED', 'REVISION_REQUESTED', 'EXPIRED', 'DISPUTED_PRESERVED', 'DELETED')),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create public.campaign_revisions if not exists
CREATE TABLE IF NOT EXISTS public.campaign_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    preview_id UUID REFERENCES public.campaign_previews(id) ON DELETE SET NULL,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'SUPERSEDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 6. Create public.campaign_final_deliveries if not exists
CREATE TABLE IF NOT EXISTS public.campaign_final_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    instagram_url TEXT,
    notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    publication_submitted_at TIMESTAMPTZ,
    delivery_status TEXT NOT NULL DEFAULT 'DELIVERED' CHECK (delivery_status IN ('DELIVERED', 'COMPLETED', 'DISPUTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Ensure payout_upi_id exists on public.creator_payout_profiles
ALTER TABLE public.creator_payout_profiles
    ADD COLUMN IF NOT EXISTS payout_upi_id TEXT;

-- 8. Drop the restrictive trigger on collaboration_requests
DROP TRIGGER IF EXISTS trg_check_creator_payout_collaboration_requests ON public.collaboration_requests;

-- 9. Sync existing creator UPI IDs and set status to VERIFIED
UPDATE public.creator_payout_profiles cp
SET 
    payout_upi_id = COALESCE(cp.payout_upi_id, c.payout_upi_id),
    verification_status = 'VERIFIED',
    updated_at = NOW()
FROM public.creator_profiles c
WHERE cp.user_id = c.id;

UPDATE public.creator_payout_profiles
SET 
    verification_status = 'VERIFIED',
    updated_at = NOW()
WHERE (cashfree_vendor_id IS NOT NULL OR payout_upi_id IS NOT NULL);

-- 10. Clean up ALL previous overloaded signatures of accept_deal_proposal
DROP FUNCTION IF EXISTS public.accept_deal_proposal(UUID);
DROP FUNCTION IF EXISTS public.accept_deal_proposal(UUID, NUMERIC);

-- 11. Create single canonical public.accept_deal_proposal
CREATE OR REPLACE FUNCTION public.accept_deal_proposal(
    p_proposal_id UUID,
    p_commission_percentage NUMERIC DEFAULT 5.00
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
    v_total_amount NUMERIC(10,2);
    v_commission_pct NUMERIC(5,2);
    v_commission_amount NUMERIC(10,2);
    v_creator_total NUMERIC(10,2);
    v_first_instalment NUMERIC(10,2);
    v_second_instalment NUMERIC(10,2);
    v_first_paise BIGINT;
    v_second_paise BIGINT;
    v_pkg_id UUID := NULL;
    v_camp_id UUID := NULL;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch active proposal
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

    -- Resolve package_id and campaign_id safely
    IF v_proposal.request_id IS NOT NULL THEN
        SELECT package_id, campaign_id INTO v_pkg_id, v_camp_id
        FROM public.collaboration_requests
        WHERE id = v_proposal.request_id;
    END IF;

    -- Verify v_pkg_id exists in creator_packages, otherwise set to NULL
    IF v_pkg_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.creator_packages WHERE id = v_pkg_id) THEN
            v_pkg_id := NULL;
        END IF;
    END IF;

    -- If still NULL, try to get a valid package for the creator
    IF v_pkg_id IS NULL THEN
        SELECT id INTO v_pkg_id
        FROM public.creator_packages
        WHERE creator_id = v_conv.creator_user_id
        LIMIT 1;
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

    -- Financial calculations: 5% platform fee added on top of creator price
    v_campaign_price := v_proposal.price;
    v_commission_pct := COALESCE(p_commission_percentage, 5.00);
    v_commission_amount := ROUND(v_campaign_price * (v_commission_pct / 100.0), 2);
    v_creator_total := v_campaign_price; -- Creator receives 100% of their quoted price
    v_total_amount := v_campaign_price + v_commission_amount; -- Total paid by business (price + 5% fee)

    v_first_instalment := ROUND(v_total_amount * 0.5, 2);
    v_second_instalment := v_total_amount - v_first_instalment;
    v_first_paise := ROUND(v_first_instalment * 100);
    v_second_paise := ROUND(v_second_instalment * 100);

    -- Unique order number
    v_order_number := 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

    -- Create canonical Order with 2-instalment split
    INSERT INTO public.orders (
        order_number,
        campaign_id,
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
        v_camp_id,
        v_conv.business_user_id,
        v_conv.business_user_id,
        v_conv.creator_user_id,
        v_conv.creator_user_id,
        v_proposal.request_id,
        v_pkg_id,
        'DEAL_CONFIRMED',
        'PENDING',
        'UNRELEASED',
        v_campaign_price,
        v_commission_amount,
        v_total_amount,
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
        'Deal confirmed. Upfront 50% payment pending via Cashfree Checkout.',
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
