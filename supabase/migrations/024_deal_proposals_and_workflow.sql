-- 024_deal_proposals_and_workflow.sql
-- Missing pieces: Structured Deal Proposals, Negotiation Flow, Locked Deal Acceptance,
-- Work Start, Storage Bucket for Deliveries, and Contextual State Enforcement.

-- 1. Create deal_proposals table
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

-- Indexes for deal_proposals
CREATE INDEX IF NOT EXISTS idx_deal_proposals_conversation_id ON public.deal_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_request_id ON public.deal_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_order_id ON public.deal_proposals(order_id);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_status ON public.deal_proposals(status);
CREATE INDEX IF NOT EXISTS idx_deal_proposals_created_at ON public.deal_proposals(created_at DESC);

-- Trigger for updated_at on deal_proposals
DROP TRIGGER IF EXISTS on_deal_proposals_updated ON public.deal_proposals;
CREATE TRIGGER on_deal_proposals_updated
    BEFORE UPDATE ON public.deal_proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on deal_proposals
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

-- Add deal_proposals to Realtime publication
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

-- 2. Update status check constraint on collaboration_requests
ALTER TABLE public.collaboration_requests DROP CONSTRAINT IF EXISTS collaboration_requests_status_check;
ALTER TABLE public.collaboration_requests ADD CONSTRAINT collaboration_requests_status_check CHECK (
    status IN ('REQUESTED', 'PENDING', 'ACCEPTED', 'NEGOTIATING', 'DEAL_CONFIRMED', 'DECLINED', 'CANCELLED', 'ENDED', 'EXPIRED')
);

-- 3. Update status check constraints on orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (
    order_status IN (
        'DRAFT',
        'REQUESTED',
        'NEGOTIATING',
        'DEAL_CONFIRMED',
        'PAYMENT_PENDING',
        'ACCEPTED_AWAITING_PAYMENT',
        'FUNDED',
        'PAID_IN_ESCROW',
        'CREATOR_PENDING',
        'ACCEPTED',
        'IN_PROGRESS',
        'WORK_STARTED',
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

-- 4. Update deliveries table columns
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS instagram_post_url TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS file_storage_path TEXT;

-- 5. Create deliveries storage bucket for actual proof uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'deliveries',
    'deliveries',
    true,
    52428800, -- 50 MB
    ARRAY[
        'video/mp4', 'video/webm', 'video/quicktime',
        'image/jpeg', 'image/png', 'image/webp',
        'application/zip', 'application/x-zip-compressed',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public access to deliveries" ON storage.objects;
CREATE POLICY "Public access to deliveries"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'deliveries');

DROP POLICY IF EXISTS "Authenticated users can upload deliveries" ON storage.objects;
CREATE POLICY "Authenticated users can upload deliveries"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'deliveries');

DROP POLICY IF EXISTS "Authenticated users can update own deliveries" ON storage.objects;
CREATE POLICY "Authenticated users can update own deliveries"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'deliveries');

-- 6. Notifications schema compatibility
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
        'NEW_MESSAGE',
        'COLLABORATION_REQUEST',
        'REQUEST_ACCEPTED',
        'REQUEST_DECLINED',
        'DEAL_PROPOSAL',
        'DEAL_CONFIRMED',
        'ORDER_CREATED',
        'ORDER_DELIVERED',
        'ORDER_APPROVED',
        'WORK_STARTED',
        'REVISION_REQUESTED',
        'SYSTEM_REVIEW',
        'PAYMENT_STATUS_CHANGED',
        'SYSTEM',
        'order_status'
    )
);

-- 7. Server-side RPC: accept_deal_proposal
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
    v_other_user_id UUID;
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

    -- Verify caller is NOT the proposer (only the receiver can accept)
    IF v_caller_id = v_proposal.proposed_by THEN
        RAISE EXCEPTION 'Only the receiving participant can accept this proposal';
    END IF;

    v_proposer_id := v_proposal.proposed_by;
    v_other_user_id := v_proposer_id;

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

    -- Create order with DEAL_CONFIRMED status
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
        v_proposal.revisions_included,
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
        'proposal_id', v_proposal.id,
        'order_status', 'DEAL_CONFIRMED',
        'total_amount', v_total_amount
    );
END;
$$;

-- 8. Server-side RPC: end_collaboration
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

-- 9. Server-side RPC: cancel_confirmed_deal
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

-- 10. Server-side RPC: mark_work_started
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
    SET order_status = 'WORK_STARTED', updated_at = v_now
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
        v_order.business_user_id, p_order_id, 'WORK_STARTED', 'Creator Started Production',
        'The creator has officially begun working on deliverables for Order #' || v_order.order_number, v_now
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 11. Server-side RPC: simulate_payment_success (for test validation before Razorpay)
CREATE OR REPLACE FUNCTION public.simulate_payment_success(p_order_id UUID)
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

    UPDATE public.orders
    SET payment_status = 'PAID',
        order_status = 'PAID',
        updated_at = v_now
    WHERE id = p_order_id;

    INSERT INTO public.order_events (
        order_id, actor_id, event_type, from_status, to_status, reason, created_at
    ) VALUES (
        p_order_id, v_caller_id, 'PAYMENT_VERIFIED', v_order.payment_status, 'PAID',
        'Platform payment confirmed. Creator notified to start work.', v_now
    );

    -- Notify Creator
    INSERT INTO public.notifications (
        user_id, related_order_id, type, title, body, created_at
    ) VALUES (
        v_order.creator_user_id, p_order_id, 'PAYMENT_STATUS_CHANGED', 'Payment Confirmed!',
        'Payment confirmed for Order #' || v_order.order_number || '. You can now start work.', v_now
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. Server-side RPC: submit_order_delivery
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

    -- Update order status
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

-- 13. Server-side RPC: accept_order_delivery
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

-- 14. Server-side RPC: request_order_revision
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
        'revisions_used', v_order.revisions_used + 1
    );
END;
$$;

