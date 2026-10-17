-- ============================================================================
-- 034_two_stage_campaign_payments.sql
-- Two-Stage Campaign Payments Architecture for MarketMyIdea
-- 
-- Implements:
-- 1. Initial Payment (50%): Paid before work begins. Creator can start working.
-- 2. Final Payment (50%): Creator shares private preview. Brand reviews and pays
--    remaining 50% before creator publishes publicly.
-- 3. Publication & Completion: Once final payment is confirmed, creator publishes
--    approved content or provides unwatermarked deliverable. Order completes.
-- 
-- Explicit Compliance:
-- No escrow arrangement or platform-held campaign balance.
-- ============================================================================

-- 1. Safely add Two-Stage Campaign Payment columns to public.orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS initial_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS final_payment_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS initial_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS preview_url TEXT,
    ADD COLUMN IF NOT EXISTS preview_notes TEXT,
    ADD COLUMN IF NOT EXISTS preview_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS final_delivery_url TEXT,
    ADD COLUMN IF NOT EXISTS final_delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS final_delivered_at TIMESTAMPTZ;

-- 2. Safely add stage column to public.payments
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'INITIAL';

-- 3. Update status constraints on public.orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
        'REQUESTED',
        'NEGOTIATING',
        'DEAL_CONFIRMED',
        'PAID',
        'WORK_STARTED',
        'IN_PROGRESS',
        'WAITING_RESPONSE',
        'PREVIEW_SUBMITTED',
        'FINAL_PAYMENT_PENDING',
        'READY_TO_PUBLISH',
        'DELIVERED',
        'REVISION_REQUESTED',
        'APPROVED',
        'AUTO_APPROVED',
        'DISPUTED',
        'SYSTEM_REVIEW',
        'PAYOUT_PENDING',
        'CANCELLED',
        'COMPLETED',
        -- Legacy statuses preserved
        'DRAFT',
        'PAYMENT_PENDING',
        'FUNDED',
        'CREATOR_PENDING',
        'ACCEPTED',
        'WAITING_FOR_BUSINESS',
        'OVERDUE',
        'ADMIN_REVIEW',
        'REFUND_PENDING',
        'REFUNDED',
        'PAID_IN_ESCROW',
        'ACCEPTED_AWAITING_PAYMENT'
    )
);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN (
        'NOT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'PARTIALLY_PAID',
        'PAID',
        'FAILED',
        'REFUND_PENDING',
        'REFUNDED',
        'FUNDED'
    )
);

-- 4. Server-side RPC: submit_private_preview
CREATE OR REPLACE FUNCTION public.submit_private_preview(
    p_order_id UUID,
    p_preview_url TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID := auth.uid();
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_conv RECORD;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.creator_user_id AND v_caller_id != v_order.creator_id THEN
        RAISE EXCEPTION 'Only the assigned creator can submit a private preview';
    END IF;

    IF p_preview_url IS NULL OR length(trim(p_preview_url)) = 0 THEN
        RAISE EXCEPTION 'Preview URL is required';
    END IF;

    -- Update order to PREVIEW_SUBMITTED
    UPDATE public.orders
    SET order_status = 'PREVIEW_SUBMITTED',
        preview_url = trim(p_preview_url),
        preview_notes = trim(p_notes),
        preview_submitted_at = v_now,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Log event in order_events
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
        p_order_id,
        v_caller_id,
        'PREVIEW_SUBMITTED',
        v_order.order_status,
        'PREVIEW_SUBMITTED',
        'Creator shared private preview for brand review prior to final payment and publication.',
        jsonb_build_object('preview_url', trim(p_preview_url), 'notes', trim(p_notes)),
        v_now
    );

    -- Notify the business partner
    INSERT INTO public.notifications (
        user_id,
        related_order_id,
        type,
        title,
        body,
        created_at
    ) VALUES (
        COALESCE(v_order.business_user_id, v_order.business_id),
        p_order_id,
        'ORDER_DELIVERED',
        'Private Preview Ready for Review!',
        'The creator has shared a private preview for Order #' || v_order.order_number || '. Review the work and complete the final 50% payment before public release.',
        v_now
    );

    -- Send message to linked conversation
    SELECT * INTO v_conv FROM public.conversations WHERE order_id = p_order_id LIMIT 1;
    IF FOUND THEN
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
            p_order_id,
            v_caller_id,
            v_caller_id,
            'creator',
            '🎬 Private preview shared: ' || trim(p_preview_url) || COALESCE(E'\nNotes: ' || trim(p_notes), ''),
            '🎬 Private preview shared: ' || trim(p_preview_url) || COALESCE(E'\nNotes: ' || trim(p_notes), ''),
            'clean',
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', 'PREVIEW_SUBMITTED',
        'preview_url', trim(p_preview_url)
    );
END;
$$;

-- 5. Server-side RPC: publish_and_complete_order
CREATE OR REPLACE FUNCTION public.publish_and_complete_order(
    p_order_id UUID,
    p_live_url TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID := auth.uid();
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_conv RECORD;
    v_deliv_id UUID;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.creator_user_id AND v_caller_id != v_order.creator_id THEN
        RAISE EXCEPTION 'Only the assigned creator can publish and complete this campaign';
    END IF;

    IF p_live_url IS NULL OR length(trim(p_live_url)) = 0 THEN
        RAISE EXCEPTION 'Live publication URL or deliverable link is required';
    END IF;

    -- Update order to COMPLETED
    UPDATE public.orders
    SET order_status = 'COMPLETED',
        payout_status = 'PAYOUT_PENDING',
        delivered_at = v_now,
        final_delivery_url = trim(p_live_url),
        final_delivery_notes = trim(p_notes),
        final_delivered_at = v_now,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Upsert deliverable record
    INSERT INTO public.deliveries (
        order_id,
        submitted_by,
        proof_url,
        instagram_post_url,
        notes,
        status,
        submitted_at
    ) VALUES (
        p_order_id,
        v_caller_id,
        trim(p_live_url),
        trim(p_live_url),
        trim(p_notes),
        'approved',
        v_now
    )
    RETURNING id INTO v_deliv_id;

    -- Log event in order_events
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
        p_order_id,
        v_caller_id,
        'ORDER_COMPLETED',
        v_order.order_status,
        'COMPLETED',
        'Creator published final approved content. Campaign marked completed.',
        jsonb_build_object('live_url', trim(p_live_url), 'notes', trim(p_notes)),
        v_now
    );

    -- Notify the business partner
    INSERT INTO public.notifications (
        user_id,
        related_order_id,
        type,
        title,
        body,
        created_at
    ) VALUES (
        COALESCE(v_order.business_user_id, v_order.business_id),
        p_order_id,
        'ORDER_APPROVED',
        'Campaign Published & Completed!',
        'The creator has published the approved content for Order #' || v_order.order_number || '.',
        v_now
    );

    -- Send message to linked conversation
    SELECT * INTO v_conv FROM public.conversations WHERE order_id = p_order_id LIMIT 1;
    IF FOUND THEN
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
            p_order_id,
            v_caller_id,
            v_caller_id,
            'creator',
            '🚀 Campaign Published & Completed! Live content: ' || trim(p_live_url) || COALESCE(E'\nNotes: ' || trim(p_notes), ''),
            '🚀 Campaign Published & Completed! Live content: ' || trim(p_live_url) || COALESCE(E'\nNotes: ' || trim(p_notes), ''),
            'clean',
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', 'COMPLETED',
        'live_url', trim(p_live_url)
    );
END;
$$;
