-- ============================================================================
-- 035_campaign_workflow_cashfree_architecture.sql
-- Complete Two-Instalment Campaign Workflow, Preview Room, and Cashfree Easy Split Architecture
-- ============================================================================

-- 1. Extend public.orders with Two-Instalment & Commission Columns
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS first_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS second_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS first_payment_amount_paise BIGINT,
    ADD COLUMN IF NOT EXISTS second_payment_amount_paise BIGINT,
    ADD COLUMN IF NOT EXISTS platform_commission_percentage NUMERIC(5, 2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS platform_commission_amount NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS creator_total_amount NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agreed_revision_limit INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_preview_id UUID,
    ADD COLUMN IF NOT EXISTS current_final_delivery_id UUID,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill amounts from total_amount where missing
UPDATE public.orders
SET 
    first_payment_amount = COALESCE(first_payment_amount, initial_payment_amount, ROUND(total_amount * 0.5, 2)),
    second_payment_amount = COALESCE(second_payment_amount, final_payment_amount, ROUND(total_amount * 0.5, 2)),
    first_payment_amount_paise = COALESCE(first_payment_amount_paise, ROUND(COALESCE(first_payment_amount, initial_payment_amount, ROUND(total_amount * 0.5, 2)) * 100)),
    second_payment_amount_paise = COALESCE(second_payment_amount_paise, ROUND(COALESCE(second_payment_amount, final_payment_amount, ROUND(total_amount * 0.5, 2)) * 100)),
    platform_commission_amount = COALESCE(platform_commission_amount, ROUND(total_amount * 0.10, 2)),
    creator_total_amount = COALESCE(creator_total_amount, ROUND(total_amount * 0.90, 2)),
    agreed_revision_limit = COALESCE(agreed_revision_limit, included_revisions, 1)
WHERE total_amount > 0 AND (first_payment_amount IS NULL OR creator_total_amount IS NULL OR creator_total_amount = 0);

-- Update order_status constraint to cover all campaign workflow states
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
        -- Legacy statuses preserved
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

-- Update payments table
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS instalment_type TEXT DEFAULT 'INITIAL',
    ADD COLUMN IF NOT EXISTS amount_in_paise BIGINT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS provider_order_id TEXT;

UPDATE public.payments
SET 
    instalment_type = COALESCE(instalment_type, stage, 'INITIAL'),
    amount_in_paise = COALESCE(amount_in_paise, ROUND(amount * 100))
WHERE amount_in_paise IS NULL;

-- 2. Create public.campaign_splits for Cashfree Easy Split platform & creator allocations
CREATE TABLE IF NOT EXISTS public.campaign_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_campaign_splits_payment_id ON public.campaign_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_splits_order_id ON public.campaign_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_campaign_splits_vendor_id ON public.campaign_splits(vendor_id);

-- 3. Create public.campaign_previews for Creator Preview Room (Watermarked, 24h Expiry)
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

CREATE INDEX IF NOT EXISTS idx_campaign_previews_order_id ON public.campaign_previews(order_id);
CREATE INDEX IF NOT EXISTS idx_campaign_previews_status_expires ON public.campaign_previews(preview_status, expires_at);

-- 4. Create public.campaign_revisions for Structured Revision Feedback & Limits
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

CREATE INDEX IF NOT EXISTS idx_campaign_revisions_order_id ON public.campaign_revisions(order_id);

-- 5. Create public.campaign_final_deliveries for Clean Final Video & Instagram URL
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

CREATE INDEX IF NOT EXISTS idx_campaign_final_deliveries_order_id ON public.campaign_final_deliveries(order_id);

-- 6. Setup Private Storage Buckets in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'campaign-previews',
        'campaign-previews',
        false, -- Strictly PRIVATE, access only via short-lived signed URLs
        104857600, -- 100 MB max file size
        ARRAY['video/mp4', 'video/webm', 'video/quicktime']
    ),
    (
        'campaign-final-deliveries',
        'campaign-final-deliveries',
        false, -- Strictly PRIVATE, access only after verified second payment
        524288000, -- 500 MB max file size
        ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'application/zip']
    )
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. RLS Policies for campaign_splits, campaign_previews, campaign_revisions, campaign_final_deliveries
ALTER TABLE public.campaign_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_final_deliveries ENABLE ROW LEVEL SECURITY;

-- Splits RLS: Creator and Business can view splits for their orders
DROP POLICY IF EXISTS "Participants can view campaign splits" ON public.campaign_splits;
CREATE POLICY "Participants can view campaign splits"
    ON public.campaign_splits FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = campaign_splits.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- Previews RLS: Creator and Business can view their order previews
DROP POLICY IF EXISTS "Participants can view campaign previews" ON public.campaign_previews;
CREATE POLICY "Participants can view campaign previews"
    ON public.campaign_previews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = campaign_previews.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- Previews Insert: Only creator can upload preview
DROP POLICY IF EXISTS "Creator can insert campaign previews" ON public.campaign_previews;
CREATE POLICY "Creator can insert campaign previews"
    ON public.campaign_previews FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = campaign_previews.order_id
            AND (o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

-- Revisions RLS: Participants can view revisions
DROP POLICY IF EXISTS "Participants can view campaign revisions" ON public.campaign_revisions;
CREATE POLICY "Participants can view campaign revisions"
    ON public.campaign_revisions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = campaign_revisions.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- Final deliveries RLS: Participants can view final deliveries (backend gates access to file based on 2nd payment)
DROP POLICY IF EXISTS "Participants can view campaign final deliveries" ON public.campaign_final_deliveries;
CREATE POLICY "Participants can view campaign final deliveries"
    ON public.campaign_final_deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = campaign_final_deliveries.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
        OR public.is_admin()
    );

-- 8. Updated accept_deal_proposal with Configurable Commission and Two-Instalment Splits
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
            'commission_percentage', v_commission_pct,
            'commission_amount', v_commission_amount,
            'creator_share', v_creator_total,
            'revisions_allowed', COALESCE(v_proposal.revisions_included, 1)
        ),
        v_now
    );

    -- Insert system message describing the confirmed terms
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
        '✓ Deal confirmed! Deliverable: ' || v_proposal.deliverable || ' | Total: ₹' || v_campaign_price || ' (Instalment 1: ₹' || v_first_instalment || ', Instalment 2: ₹' || v_second_instalment || '). Order #' || v_order_number || ' ready for first 50% payment.',
        '✓ Deal confirmed! Deliverable: ' || v_proposal.deliverable || ' | Total: ₹' || v_campaign_price || ' (Instalment 1: ₹' || v_first_instalment || ', Instalment 2: ₹' || v_second_instalment || '). Order #' || v_order_number || ' ready for first 50% payment.',
        'clean',
        v_now
    );

    -- Notify Business to pay first instalment
    INSERT INTO public.notifications (
        user_id,
        related_order_id,
        type,
        title,
        body,
        created_at
    ) VALUES (
        v_conv.business_user_id,
        v_order_id,
        'ORDER_STATUS_CHANGED',
        'Deal Confirmed: Pay First 50% Instalment',
        'Deal terms confirmed for Order #' || v_order_number || '. Pay first instalment of ₹' || v_first_instalment || ' to enable creator to start work.',
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'order_status', 'DEAL_CONFIRMED',
        'total_amount', v_campaign_price,
        'first_payment_amount', v_first_instalment,
        'second_payment_amount', v_second_instalment,
        'platform_commission_percentage', v_commission_pct,
        'platform_commission_amount', v_commission_amount,
        'creator_total_amount', v_creator_total,
        'agreed_revision_limit', COALESCE(v_proposal.revisions_included, 1)
    );
END;
$$;

-- 9. Helper RPC to identify expired previews safely for backend cleanup
CREATE OR REPLACE FUNCTION public.get_expired_previews()
RETURNS TABLE (
    preview_id UUID,
    order_id UUID,
    storage_path TEXT,
    expires_at TIMESTAMPTZ,
    order_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS preview_id,
        p.order_id,
        p.storage_path,
        p.expires_at,
        o.order_status
    FROM public.campaign_previews p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.preview_status = 'ACTIVE'
      AND p.expires_at <= NOW()
      AND p.deleted_at IS NULL
      -- Preservation rule: active dispute keeps evidence intact
      AND o.order_status NOT IN ('DISPUTED', 'SYSTEM_REVIEW', 'ADMIN_REVIEW');
END;
$$;
