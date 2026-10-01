-- ============================================================================
-- MIGRATION 023: WORKFLOW ARCHITECTURE CLEANUP & SYSTEM REVIEW
-- ============================================================================
-- Description:
-- 1. Updates order_status check constraint to support the complete workflow:
--    REQUESTED, PAYMENT_PENDING, ACCEPTED, IN_PROGRESS, WAITING_FOR_BUSINESS,
--    OVERDUE, DELIVERED, REVISION_REQUESTED, APPROVED, AUTO_APPROVED,
--    DISPUTED, SYSTEM_REVIEW, COMPLETED, CANCELLED, etc.
-- 2. Updates payment_status check constraint for Razorpay readiness:
--    NOT_REQUIRED, PENDING, PROCESSING, PAID, FAILED, REFUND_PENDING, REFUNDED.
-- 3. Adds workflow columns to orders:
--    included_revisions, revisions_used, delivered_at, auto_approve_deadline,
--    waiting_reason, extension_requested_deadline, extension_reason,
--    extension_status, system_review_reason, system_review_description,
--    system_review_evidence_url.
-- 4. Creates automated trigger to set delivered_at and 4-day auto_approve_deadline
--    upon submission of DELIVERED status.
-- 5. Implements process_auto_approvals() server-side RPC for 4-day automatic approvals.
-- ============================================================================

-- 1. Update payment_status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN (
        'NOT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED',
        'REFUND_PENDING',
        'REFUNDED',
        'FUNDED' -- backwards compatibility with early migrations
    )
);

-- 2. Update order_status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
        'DRAFT',
        'REQUESTED',
        'PAYMENT_PENDING',
        'ACCEPTED_AWAITING_PAYMENT',
        'FUNDED',
        'PAID_IN_ESCROW',
        'CREATOR_PENDING',
        'ACCEPTED',
        'IN_PROGRESS',
        'WAITING_FOR_BUSINESS',
        'OVERDUE',
        'DELIVERED',
        'REVISION_REQUESTED',
        'APPROVED',
        'AUTO_APPROVED',
        'DISPUTED',
        'SYSTEM_REVIEW',
        'ADMIN_REVIEW',
        'REFUND_PENDING',
        'REFUNDED',
        'PAYOUT_PENDING',
        'PAID',
        'CANCELLED',
        'COMPLETED'
    )
);

-- 3. Add workflow and review tracking columns to public.orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS included_revisions INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS revisions_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_approve_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS waiting_reason TEXT,
    ADD COLUMN IF NOT EXISTS extension_requested_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS extension_reason TEXT,
    ADD COLUMN IF NOT EXISTS extension_status TEXT DEFAULT 'NONE' CHECK (extension_status IN ('NONE', 'REQUESTED', 'ACCEPTED', 'DECLINED')),
    ADD COLUMN IF NOT EXISTS system_review_reason TEXT,
    ADD COLUMN IF NOT EXISTS system_review_description TEXT,
    ADD COLUMN IF NOT EXISTS system_review_evidence_url TEXT;

-- 4. Trigger to maintain delivered_at, auto_approve_deadline (4 days), and revision counters
CREATE OR REPLACE FUNCTION public.handle_order_delivery_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Transitioning to DELIVERED: set delivered_at and 4-day deadline
    IF NEW.order_status = 'DELIVERED' AND (OLD.order_status IS DISTINCT FROM 'DELIVERED') THEN
        NEW.delivered_at := COALESCE(NEW.delivered_at, NOW());
        NEW.auto_approve_deadline := NOW() + INTERVAL '4 days';
    END IF;

    -- Transitioning to REVISION_REQUESTED: increment revisions_used and clear auto_approve_deadline
    IF NEW.order_status = 'REVISION_REQUESTED' AND (OLD.order_status IS DISTINCT FROM 'REVISION_REQUESTED') THEN
        NEW.revisions_used := COALESCE(OLD.revisions_used, 0) + 1;
        NEW.auto_approve_deadline := NULL;
    END IF;

    -- If approved or disputed: clear auto-approve deadline
    IF NEW.order_status IN ('APPROVED', 'AUTO_APPROVED', 'DISPUTED', 'SYSTEM_REVIEW', 'COMPLETED', 'CANCELLED') THEN
        NEW.auto_approve_deadline := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_delivery_workflow ON public.orders;
CREATE TRIGGER trg_order_delivery_workflow
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_delivery_workflow();

-- 5. Server-side auto-approval function (can be triggered by cron or on order query)
CREATE OR REPLACE FUNCTION public.process_auto_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
BEGIN
    FOR r IN
        SELECT id, subtotal, business_user_id, creator_user_id, order_number
        FROM public.orders
        WHERE order_status = 'DELIVERED'
          AND auto_approve_deadline IS NOT NULL
          AND auto_approve_deadline <= NOW()
    LOOP
        UPDATE public.orders
        SET order_status = 'AUTO_APPROVED',
            payout_status = 'PAYOUT_PENDING',
            auto_approve_deadline = NULL,
            updated_at = NOW()
        WHERE id = r.id;

        -- Record system order event
        INSERT INTO public.order_events (
            order_id,
            from_status,
            to_status,
            actor_id,
            reason,
            created_at
        ) VALUES (
            r.id,
            'DELIVERED',
            'AUTO_APPROVED',
            NULL,
            'Automatically approved after 4-day business review window elapsed without revision request or dispute.',
            NOW()
        );

        -- Notify Creator
        IF r.creator_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                order_id,
                type,
                title,
                content,
                created_at
            ) VALUES (
                r.creator_user_id,
                r.id,
                'order_status',
                'Delivery Auto-Approved',
                'Order #' || r.order_number || ' has been automatically approved after 4 days of review. Payout is now eligible.',
                NOW()
            );
        END IF;

        -- Notify Business
        IF r.business_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                order_id,
                type,
                title,
                content,
                created_at
            ) VALUES (
                r.business_user_id,
                r.id,
                'order_status',
                'Delivery Auto-Approved',
                'Order #' || r.order_number || ' was automatically approved following the conclusion of the 4-day review period.',
                NOW()
            );
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.process_auto_approvals() TO authenticated, anon;

-- ============================================================================
-- 6. RLS POLICIES FOR DELIVERIES, DISPUTES, AND ORDER EVENTS
-- ============================================================================
DROP POLICY IF EXISTS "Order parties can view deliveries" ON public.deliveries;
CREATE POLICY "Order parties can view deliveries"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Creators can submit deliveries" ON public.deliveries;
CREATE POLICY "Creators can submit deliveries"
    ON public.deliveries FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties and admin can view disputes" ON public.disputes;
CREATE POLICY "Order parties and admin can view disputes"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = disputes.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can open disputes" ON public.disputes;
CREATE POLICY "Order parties can open disputes"
    ON public.disputes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = disputes.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can view order events" ON public.order_events;
CREATE POLICY "Order parties can view order events"
    ON public.order_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Order parties can insert order events" ON public.order_events;
CREATE POLICY "Order parties can insert order events"
    ON public.order_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.business_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_id = auth.uid() OR o.creator_user_id = auth.uid())
        )
    );

-- Also add deliveries to Supabase Realtime publication
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

