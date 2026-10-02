-- ============================================================================
-- 027_production_workflow_schema_repair.sql
-- Idempotent, safe reconciliation migration for production Supabase database.
-- 
-- Fixes:
-- 1. Missing columns in public.orders (included_revisions, revisions_used, work_started_at,
--    delivered_at, auto_approve_deadline, agreed_price, agreed_deadline, requirements, etc.)
-- 2. Structured deal proposals table & RLS policies (public.deal_proposals)
-- 3. Workflow tables (order_briefs, deliveries, order_events, payments, notifications)
-- 4. Status check constraints (orders, collaboration_requests, payments)
-- 5. Canonical RPCs for deal negotiation, confirmation, payment, work start, delivery & revision
-- 
-- Preserves all existing production data, tables, constraints, and RLS policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ORDERS TABLE RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.creator_packages(id) ON DELETE RESTRICT,
    order_status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    payout_status TEXT NOT NULL DEFAULT 'UNRELEASED',
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS business_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS included_revisions INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS revisions_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_approve_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS agreed_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS agreed_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS requirements TEXT,
    ADD COLUMN IF NOT EXISTS waiting_reason TEXT,
    ADD COLUMN IF NOT EXISTS extension_requested_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS extension_reason TEXT,
    ADD COLUMN IF NOT EXISTS extension_status TEXT DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS system_review_reason TEXT,
    ADD COLUMN IF NOT EXISTS system_review_description TEXT,
    ADD COLUMN IF NOT EXISTS system_review_evidence_url TEXT;

-- Safe backfill for existing rows
UPDATE public.orders
SET agreed_price = COALESCE(agreed_price, subtotal),
    agreed_deadline = COALESCE(agreed_deadline, deadline),
    business_user_id = COALESCE(business_user_id, business_id),
    creator_user_id = COALESCE(creator_user_id, creator_id),
    included_revisions = COALESCE(included_revisions, 1),
    revisions_used = COALESCE(revisions_used, 0)
WHERE agreed_price IS NULL
   OR agreed_deadline IS NULL
   OR business_user_id IS NULL
   OR creator_user_id IS NULL
   OR included_revisions IS NULL
   OR revisions_used IS NULL;

-- Safe update of order_status check constraint
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
        'REFUNDED'
    )
);

-- Safe update of payment_status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN ('NOT_REQUIRED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'FUNDED')
);

-- Safe update of payout_status check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payout_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payout_status_check CHECK (
    payout_status IN ('UNRELEASED', 'PAYOUT_PENDING', 'PAID', 'HELD', 'CANCELLED')
);

-- Delivery workflow trigger for orders
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

-- Synchronize legacy and canonical orders columns
CREATE OR REPLACE FUNCTION public.handle_order_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.business_user_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.business_user_id := NEW.business_id;
    END IF;
    IF NEW.business_id IS NULL AND NEW.business_user_id IS NOT NULL THEN
        NEW.business_id := NEW.business_user_id;
    END IF;
    IF NEW.creator_user_id IS NULL AND NEW.creator_id IS NOT NULL THEN
        NEW.creator_user_id := NEW.creator_id;
    END IF;
    IF NEW.creator_id IS NULL AND NEW.creator_user_id IS NOT NULL THEN
        NEW.creator_id := NEW.creator_user_id;
    END IF;
    IF NEW.agreed_price IS NULL AND NEW.subtotal IS NOT NULL THEN
        NEW.agreed_price := NEW.subtotal;
    END IF;
    IF NEW.agreed_deadline IS NULL AND NEW.deadline IS NOT NULL THEN
        NEW.agreed_deadline := NEW.deadline;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_sync ON public.orders;
CREATE TRIGGER on_order_sync
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_sync();

-- ----------------------------------------------------------------------------
-- 2. COLLABORATION REQUESTS RECONCILIATION
-- ----------------------------------------------------------------------------
ALTER TABLE public.collaboration_requests 
  ALTER COLUMN status SET DEFAULT 'REQUESTED';

ALTER TABLE public.collaboration_requests 
  DROP CONSTRAINT IF EXISTS collaboration_requests_status_check;

ALTER TABLE public.collaboration_requests 
  ADD CONSTRAINT collaboration_requests_status_check 
  CHECK (status IN (
    'REQUESTED',
    'PENDING',
    'ACCEPTED',
    'NEGOTIATING',
    'DEAL_CONFIRMED',
    'DECLINED',
    'CANCELLED',
    'ENDED',
    'EXPIRED'
  ));

-- ----------------------------------------------------------------------------
-- 3. DEAL PROPOSALS TABLE & RLS RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    proposed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deliverable TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    revisions_included INTEGER NOT NULL DEFAULT 1 CHECK (revisions_included >= 0),
    key_requirements TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACCEPTED', 'SUPERSEDED', 'DECLINED', 'CANCELLED')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    supersedes_proposal_id UUID REFERENCES public.deal_proposals(id) ON DELETE SET NULL,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_proposals_conversation_id ON public.deal_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_request_id ON public.deal_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_order_id ON public.deal_proposals(order_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_status ON public.deal_proposals(status);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_created_at ON public.deal_proposals(created_at DESC);

ALTER TABLE public.deal_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can view deal proposals"
    ON public.deal_proposals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
        OR proposed_by = auth.uid()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can create deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can create deal proposals"
    ON public.deal_proposals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = proposed_by
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Participants can update deal proposals" ON public.deal_proposals;
CREATE POLICY "Participants can update deal proposals"
    ON public.deal_proposals FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = deal_proposals.conversation_id
            AND (c.business_user_id = auth.uid() OR c.creator_user_id = auth.uid())
        )
        OR proposed_by = auth.uid()
        OR public.is_admin()
    );

ALTER TABLE public.deal_proposals REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'deal_proposals'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_proposals;
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. ORDER BRIEFS RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    requirements TEXT NOT NULL,
    dos TEXT,
    donts TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view briefs" ON public.order_briefs;
CREATE POLICY "Participants can view briefs"
    ON public.order_briefs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_briefs.order_id
            AND (o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid() OR o.business_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can create briefs" ON public.order_briefs;
CREATE POLICY "Participants can create briefs"
    ON public.order_briefs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_briefs.order_id
            AND (o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid() OR o.business_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 5. DELIVERIES RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proof_url TEXT NOT NULL,
    instagram_post_url TEXT,
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'disputed', 'revised'))
);

ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS instagram_post_url TEXT;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order participants can view deliveries" ON public.deliveries;
CREATE POLICY "Order participants can view deliveries"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid() OR o.business_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Creators can submit deliveries" ON public.deliveries;
CREATE POLICY "Creators can submit deliveries"
    ON public.deliveries FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
            AND (o.creator_user_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 6. PAYMENTS RECONCILIATION (RAZORPAY STANDARD GATEWAY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_payment_id TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'paid', 'refunded', 'failed')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS business_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'captured', 'paid', 'refunded', 'failed')
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order participants can view payments" ON public.payments;
CREATE POLICY "Order participants can view payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = business_id
        OR auth.uid() = creator_user_id
        OR auth.uid() = creator_id
        OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
            AND (o.business_user_id = auth.uid() OR o.business_id = auth.uid() OR o.creator_user_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 7. ORDER EVENTS RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
    from_status TEXT,
    to_status TEXT NOT NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_events ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE';

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON public.order_events(created_at);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view order events" ON public.order_events;
CREATE POLICY "Participants can view order events"
    ON public.order_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid() OR o.business_id = auth.uid() OR o.creator_id = auth.uid())
        )
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 8. NOTIFICATIONS RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    related_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. RPC: accept_deal_proposal
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_deal_proposal(p_proposal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal RECORD;
    v_conv RECORD;
    v_caller_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_platform_fee NUMERIC(10, 2);
    v_total_amount NUMERIC(10, 2);
    v_proposer_id UUID;
    v_pkg_id UUID;
    v_camp_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept deal proposal';
    END IF;

    -- Fetch active proposal
    SELECT * INTO v_proposal
    FROM public.deal_proposals
    WHERE id = p_proposal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal proposal not found';
    END IF;

    IF v_proposal.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Only ACTIVE proposals can be accepted (current: %)', v_proposal.status;
    END IF;

    -- Fetch conversation
    SELECT * INTO v_conv
    FROM public.conversations
    WHERE id = v_proposal.conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Linked conversation not found';
    END IF;

    -- Verify caller is a participant
    IF v_caller_id != v_conv.business_user_id AND v_caller_id != v_conv.creator_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a participant in this conversation';
    END IF;

    -- Verify caller is NOT the proposer (only receiving participant can accept)
    IF v_caller_id = v_proposal.proposed_by THEN
        RAISE EXCEPTION 'Only the receiving participant can accept this proposal';
    END IF;

    v_proposer_id := v_proposal.proposed_by;

    -- Calculate fee and amounts (5% platform fee)
    v_platform_fee := ROUND(v_proposal.price * 0.05, 2);
    v_total_amount := v_proposal.price + v_platform_fee;

    -- Fetch campaign and package details if available
    IF v_proposal.request_id IS NOT NULL THEN
        SELECT package_id, campaign_id INTO v_pkg_id, v_camp_id
        FROM public.collaboration_requests
        WHERE id = v_proposal.request_id;
    END IF;

    -- Update this proposal to ACCEPTED
    UPDATE public.deal_proposals
    SET status = 'ACCEPTED',
        accepted_by = v_caller_id,
        accepted_at = v_now,
        updated_at = v_now
    WHERE id = p_proposal_id;

    -- Mark any other ACTIVE proposals in this conversation as SUPERSEDED
    UPDATE public.deal_proposals
    SET status = 'SUPERSEDED',
        updated_at = v_now
    WHERE conversation_id = v_conv.id
      AND id != p_proposal_id
      AND status = 'ACTIVE';

    -- Generate order number
    v_order_number := 'ORD-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

    -- Create order with DEAL_CONFIRMED status and full workflow columns
    INSERT INTO public.orders (
        order_number,
        campaign_id,
        request_id,
        business_id,
        business_user_id,
        creator_id,
        creator_user_id,
        package_id,
        order_status,
        payment_status,
        payout_status,
        subtotal,
        platform_fee,
        total_amount,
        deadline,
        agreed_price,
        agreed_deadline,
        requirements,
        included_revisions,
        revisions_used,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        v_camp_id,
        v_proposal.request_id,
        v_conv.business_user_id,
        v_conv.business_user_id,
        v_conv.creator_user_id,
        v_conv.creator_user_id,
        COALESCE(v_pkg_id, '00000000-0000-0000-0000-000000000000'::uuid),
        'DEAL_CONFIRMED',
        'PENDING',
        'UNRELEASED',
        v_proposal.price,
        v_platform_fee,
        v_total_amount,
        v_proposal.deadline,
        v_proposal.price,
        v_proposal.deadline,
        v_proposal.key_requirements,
        COALESCE(v_proposal.revisions_included, 1),
        0,
        v_now,
        v_now
    )
    RETURNING id INTO v_order_id;

    -- Insert order_briefs record
    INSERT INTO public.order_briefs (
        order_id,
        objective,
        requirements,
        deadline,
        created_at
    ) VALUES (
        v_order_id,
        v_proposal.deliverable,
        v_proposal.key_requirements,
        v_proposal.deadline,
        v_now
    );

    -- Insert audit event in order_events
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
        'Deal proposal #' || v_proposal.version || ' accepted. Locked terms agreed.',
        jsonb_build_object(
            'proposal_id', v_proposal.id,
            'accepted_by', v_caller_id,
            'price', v_proposal.price,
            'deadline', v_proposal.deadline,
            'revisions_included', v_proposal.revisions_included
        ),
        v_now
    );

    -- Link proposal and conversation to order
    UPDATE public.deal_proposals SET order_id = v_order_id WHERE id = p_proposal_id;
    UPDATE public.conversations SET order_id = v_order_id, updated_at = v_now WHERE id = v_conv.id;

    -- Update request status if linked
    IF v_proposal.request_id IS NOT NULL THEN
        UPDATE public.collaboration_requests
        SET status = 'DEAL_CONFIRMED',
            updated_at = v_now
        WHERE id = v_proposal.request_id;
    END IF;

    -- Notify Proposer
    INSERT INTO public.notifications (
        user_id,
        related_order_id,
        related_conversation_id,
        type,
        title,
        body,
        created_at
    ) VALUES (
        v_proposer_id,
        v_order_id,
        v_conv.id,
        'DEAL_CONFIRMED',
        'Deal Proposal Accepted!',
        'Your deal proposal for "' || v_proposal.deliverable || '" was accepted. Order #' || v_order_number || ' is confirmed.',
        v_now
    );

    -- System message in conversation
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
        '✓ Deal confirmed! Agreed deliverable: ' || v_proposal.deliverable || ' for ₹' || v_proposal.price || '. Order #' || v_order_number || ' created (Status: Deal Confirmed - Payment Pending).',
        '✓ Deal confirmed! Agreed deliverable: ' || v_proposal.deliverable || ' for ₹' || v_proposal.price || '. Order #' || v_order_number || ' created (Status: Deal Confirmed - Payment Pending).',
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

-- ----------------------------------------------------------------------------
-- 10. RPC: end_collaboration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_collaboration(p_conversation_id UUID, p_reason TEXT DEFAULT 'Collaboration ended during negotiation.')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conv RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversation not found';
    END IF;

    IF v_caller_id != v_conv.business_user_id AND v_caller_id != v_conv.creator_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a participant';
    END IF;

    -- Cancel all active proposals
    UPDATE public.deal_proposals
    SET status = 'CANCELLED', updated_at = v_now
    WHERE conversation_id = p_conversation_id AND status = 'ACTIVE';

    -- Update linked request
    IF v_conv.request_id IS NOT NULL THEN
        UPDATE public.collaboration_requests
        SET status = 'ENDED', updated_at = v_now
        WHERE id = v_conv.request_id;
    END IF;

    -- If an unpaid order was created, cancel it
    IF v_conv.order_id IS NOT NULL THEN
        UPDATE public.orders
        SET order_status = 'CANCELLED', updated_at = v_now
        WHERE id = v_conv.order_id AND payment_status != 'PAID';

        INSERT INTO public.order_events (
            order_id, actor_id, event_type, from_status, to_status, reason, created_at
        ) VALUES (
            v_conv.order_id, v_caller_id, 'ORDER_CANCELLED', 'NEGOTIATING', 'CANCELLED', p_reason, v_now
        );
    END IF;

    -- System message
    INSERT INTO public.messages (
        conversation_id, sender_id, sender_user_id, sender_role, body, message, moderation_status, created_at
    ) VALUES (
        p_conversation_id, v_caller_id, v_caller_id,
        CASE WHEN v_caller_id = v_conv.business_user_id THEN 'business' ELSE 'creator' END,
        'Collaboration ended. ' || p_reason,
        'Collaboration ended. ' || p_reason,
        'clean', v_now
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. RPC: cancel_confirmed_deal
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_confirmed_deal(p_order_id UUID, p_reason TEXT DEFAULT 'Deal cancelled before payment.')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.business_user_id AND v_caller_id != v_order.business_id THEN
        RAISE EXCEPTION 'Only the business can cancel the deal before payment';
    END IF;

    IF v_order.payment_status = 'PAID' THEN
        RAISE EXCEPTION 'Paid orders cannot be directly cancelled via cancel deal; use System Review';
    END IF;

    UPDATE public.orders
    SET order_status = 'CANCELLED', updated_at = v_now
    WHERE id = p_order_id;

    IF v_order.request_id IS NOT NULL THEN
        UPDATE public.collaboration_requests
        SET status = 'CANCELLED', updated_at = v_now
        WHERE id = v_order.request_id;
    END IF;

    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'ORDER_CANCELLED', v_order.order_status, 'CANCELLED', p_reason, v_now
    );

    -- Notify Creator
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.creator_user_id, p_order_id, 'SYSTEM', 'Deal Cancelled by Business',
        'Order #' || v_order.order_number || ' was cancelled before payment.', v_now
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. RPC: verify_and_confirm_payment (Razorpay Standard Gateway)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_and_confirm_payment(
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_conv RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_actor_id UUID := auth.uid();
BEGIN
    -- Find payment record by razorpay_order_id
    SELECT * INTO v_payment
    FROM public.payments
    WHERE razorpay_order_id = p_razorpay_order_id;

    IF NOT FOUND THEN
        SELECT * INTO v_payment
        FROM public.payments
        WHERE provider_payment_id = p_razorpay_order_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Payment record for Razorpay Order % not found', p_razorpay_order_id;
        END IF;
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated order % not found', v_payment.order_id;
    END IF;

    -- Idempotency check: if already paid, return early with success
    IF v_payment.status = 'PAID' AND v_order.payment_status = 'PAID' THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_paid', true,
            'order_id', v_order.id,
            'order_number', v_order.order_number,
            'payment_id', v_payment.id,
            'order_status', v_order.order_status
        );
    END IF;

    -- Update payments table
    UPDATE public.payments
    SET status = 'captured',
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
        payment_method = COALESCE(p_payment_method, payment_method),
        updated_at = v_now
    WHERE id = v_payment.id;

    -- Atomically transition order to PAID
    UPDATE public.orders
    SET payment_status = 'PAID',
        order_status = 'PAID',
        updated_at = v_now
    WHERE id = v_order.id;

    -- Record audit event in order_events
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
        v_order.id,
        COALESCE(v_actor_id, v_order.business_user_id),
        'PAYMENT_CONFIRMED',
        v_order.order_status,
        'PAID',
        'Payment of ₹' || v_order.total_amount || ' verified and confirmed via Razorpay Payment Gateway.',
        jsonb_build_object(
            'razorpay_order_id', p_razorpay_order_id,
            'razorpay_payment_id', p_razorpay_payment_id,
            'payment_method', p_payment_method,
            'amount', v_order.total_amount
        ),
        v_now
    );

    -- Notify Creator
    INSERT INTO public.notifications (
        user_id,
        related_order_id,
        type,
        title,
        body,
        created_at
    ) VALUES (
        v_order.creator_user_id,
        v_order.id,
        'PAYMENT_RECEIVED',
        'Payment Received!',
        'Payment for Order #' || v_order.order_number || ' (₹' || v_order.total_amount || ') has been successfully paid. You can now start the work.',
        v_now
    );

    -- Find conversation
    SELECT id INTO v_conv
    FROM public.conversations
    WHERE order_id = v_order.id
    LIMIT 1;

    IF v_conv.id IS NOT NULL THEN
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
            v_order.id,
            v_order.business_user_id,
            v_order.business_user_id,
            'business',
            '✓ Payment verified! Order #' || v_order.order_number || ' is now fully paid (₹' || v_order.total_amount || '). The creator can now start working.',
            '✓ Payment verified! Order #' || v_order.order_number || ' is now fully paid (₹' || v_order.total_amount || '). The creator can now start working.',
            'clean',
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'payment_id', v_payment.id,
        'order_status', 'PAID',
        'payment_status', 'PAID'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. RPC: mark_work_started (Enforces verified payment before work starts)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_work_started(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.creator_user_id AND v_caller_id != v_order.creator_id THEN
        RAISE EXCEPTION 'Only the creator can mark work started';
    END IF;

    IF v_order.payment_status != 'PAID' THEN
        RAISE EXCEPTION 'Work cannot be marked started before payment is confirmed';
    END IF;

    UPDATE public.orders
    SET order_status = 'WORK_STARTED',
        work_started_at = COALESCE(work_started_at, v_now),
        updated_at = v_now
    WHERE id = p_order_id;

    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'WORK_STARTED', v_order.order_status, 'WORK_STARTED',
        'Creator confirmed work has officially started on production.', v_now
    );

    -- Notify Business
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.business_user_id, p_order_id, 'WORK_STARTED', 'Work Started on Your Order',
        'Creator has officially marked Order #' || v_order.order_number || ' as started.', v_now
    );

    RETURN jsonb_build_object('success', true, 'order_status', 'WORK_STARTED');
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. RPC: submit_order_delivery
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_order_delivery(
    p_order_id UUID,
    p_proof_url TEXT,
    p_instagram_post_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_deadline TIMESTAMPTZ := timezone('utc'::text, now() + INTERVAL '4 days');
    v_delivery_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.creator_user_id AND v_caller_id != v_order.creator_id THEN
        RAISE EXCEPTION 'Only the creator can submit delivery';
    END IF;

    IF v_order.payment_status != 'PAID' THEN
        RAISE EXCEPTION 'Cannot submit delivery before payment is verified';
    END IF;

    IF p_proof_url IS NULL OR trim(p_proof_url) = '' THEN
        RAISE EXCEPTION 'Proof asset URL is required';
    END IF;

    -- Insert into deliveries table
    INSERT INTO public.deliveries (
        order_id,
        submitted_by,
        proof_url,
        instagram_post_url,
        notes,
        submitted_at,
        status
    ) VALUES (
        p_order_id,
        v_caller_id,
        p_proof_url,
        p_instagram_post_url,
        p_notes,
        v_now,
        'pending_review'
    )
    RETURNING id INTO v_delivery_id;

    -- Update order to DELIVERED with 4-day auto approval window
    UPDATE public.orders
    SET order_status = 'DELIVERED',
        delivered_at = v_now,
        auto_approve_deadline = v_deadline,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Record event
    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, metadata, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'DELIVERY_SUBMITTED', v_order.order_status, 'DELIVERED',
        'Creator submitted delivery proof. 4-day business review window initiated.',
        jsonb_build_object('delivery_id', v_delivery_id, 'proof_url', p_proof_url, 'instagram_post_url', p_instagram_post_url),
        v_now
    );

    -- Notify Business
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.business_user_id, p_order_id, 'ORDER_DELIVERED', 'Deliverable Submitted for Review',
        'Creator submitted delivery for Order #' || v_order.order_number || '. You have 4 days to review.', v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', v_delivery_id,
        'order_status', 'DELIVERED',
        'auto_approve_deadline', v_deadline
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 15. RPC: accept_order_delivery
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_order_delivery(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.business_user_id AND v_caller_id != v_order.business_id THEN
        RAISE EXCEPTION 'Only the business can accept the delivery';
    END IF;

    IF v_order.order_status != 'DELIVERED' THEN
        RAISE EXCEPTION 'Only orders in DELIVERED state can be accepted (current: %)', v_order.order_status;
    END IF;

    UPDATE public.orders
    SET order_status = 'COMPLETED',
        payout_status = 'PAYOUT_PENDING',
        auto_approve_deadline = NULL,
        updated_at = v_now
    WHERE id = p_order_id;

    -- Update deliveries status
    UPDATE public.deliveries
    SET status = 'approved'
    WHERE order_id = p_order_id;

    -- Record event
    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'ORDER_COMPLETED', 'DELIVERED', 'COMPLETED',
        'Business approved delivery. Order completed and payout became eligible.', v_now
    );

    -- Notify Creator
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.creator_user_id, p_order_id, 'ORDER_APPROVED', 'Delivery Accepted!',
        'Your delivery for Order #' || v_order.order_number || ' was accepted. Payout is now eligible.', v_now
    );

    RETURN jsonb_build_object('success', true, 'order_status', 'COMPLETED');
END;
$$;

-- ----------------------------------------------------------------------------
-- 16. RPC: request_order_revision
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_order_revision(p_order_id UUID, p_notes TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_caller_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_caller_id != v_order.business_user_id AND v_caller_id != v_order.business_id THEN
        RAISE EXCEPTION 'Only the business can request revisions';
    END IF;

    IF v_order.order_status != 'DELIVERED' THEN
        RAISE EXCEPTION 'Revisions can only be requested on DELIVERED orders (current: %)', v_order.order_status;
    END IF;

    IF v_order.revisions_used >= v_order.included_revisions THEN
        RAISE EXCEPTION 'All included revisions (% of %) have already been used', v_order.revisions_used, v_order.included_revisions;
    END IF;

    UPDATE public.orders
    SET order_status = 'REVISION_REQUESTED',
        revisions_used = revisions_used + 1,
        auto_approve_deadline = NULL,
        updated_at = v_now
    WHERE id = p_order_id;

    UPDATE public.deliveries
    SET status = 'revised'
    WHERE order_id = p_order_id AND status = 'pending_review';

    -- Record event
    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'REVISION_REQUESTED', 'DELIVERED', 'REVISION_REQUESTED',
        'Business requested revision (' || (v_order.revisions_used + 1) || '/' || v_order.included_revisions || '): ' || p_notes,
        v_now
    );

    -- Notify Creator
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.creator_user_id, p_order_id, 'REVISION_REQUESTED', 'Revision Requested',
        'Business requested a revision on Order #' || v_order.order_number || ': ' || p_notes, v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_status', 'REVISION_REQUESTED',
        'revisions_used', v_order.revisions_used + 1,
        'included_revisions', v_order.included_revisions
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 17. RPC: process_auto_approvals
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_auto_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_count INTEGER := 0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    FOR v_order IN
        SELECT * FROM public.orders
        WHERE order_status = 'DELIVERED'
          AND auto_approve_deadline IS NOT NULL
          AND auto_approve_deadline <= v_now
    LOOP
        UPDATE public.orders
        SET order_status = 'AUTO_APPROVED',
            payout_status = 'PAYOUT_PENDING',
            auto_approve_deadline = NULL,
            updated_at = v_now
        WHERE id = v_order.id;

        UPDATE public.deliveries
        SET status = 'approved'
        WHERE order_id = v_order.id AND status = 'pending_review';

        INSERT INTO public.order_events (
            order_id, event_type, from_status, to_status, reason, created_at
        ) VALUES (
            v_order.id, 'AUTO_APPROVED', 'DELIVERED', 'AUTO_APPROVED',
            'Order was auto-approved because 4-day business review window expired without revisions requested.', v_now
        );

        INSERT INTO public.notifications (
            user_id, related_order_id, type, title, body, created_at
        ) VALUES (
            v_order.creator_user_id, v_order.id, 'ORDER_AUTO_APPROVED', 'Order Auto-Approved!',
            'Order #' || v_order.order_number || ' was auto-approved after 4 days. Payout is now eligible.', v_now
        );

        INSERT INTO public.notifications (
            user_id, related_order_id, type, title, body, created_at
        ) VALUES (
            v_order.business_user_id, v_order.id, 'ORDER_AUTO_APPROVED', 'Order Auto-Approved',
            'Order #' || v_order.order_number || ' was auto-approved after the 4-day review window expired.', v_now
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 18. STORAGE: Deliverables Bucket
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 19. RELOAD POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
