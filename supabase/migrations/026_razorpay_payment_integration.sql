-- ============================================================================
-- 026_razorpay_payment_integration.sql
-- Razorpay Test Mode Payment Gateway Integration for Market My App
-- ============================================================================

-- 1. Safely update public.payments table columns
ALTER TABLE public.payments ALTER COLUMN provider SET DEFAULT 'razorpay';
ALTER TABLE public.payments ALTER COLUMN provider_payment_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN provider_payment_id SET DEFAULT '';

-- Add missing columns
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Update status check constraint on payments table to support canonical states
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (
    status IN (
        'NOT_REQUIRED',
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED',
        'REFUND_PENDING',
        'REFUNDED',
        -- legacy lowercase aliases for backwards compatibility
        'pending',
        'captured',
        'refunded',
        'failed'
    )
);

-- 3. Update orders payment_status check constraint to ensure all states are supported
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
        'FUNDED'
    )
);

-- 4. Create indexes for performance and webhook lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_user_id ON public.payments(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 5. Trigger for updated_at on payments
DROP TRIGGER IF EXISTS on_payments_updated ON public.payments;
CREATE TRIGGER on_payments_updated
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Add payments to Supabase Realtime publication
ALTER TABLE public.payments REPLICA IDENTITY FULL;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'payments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
        END IF;
    END IF;
END $$;

-- 7. Ensure RLS on payments table: normal clients can only SELECT their own payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order parties and admin can view payments" ON public.payments;
CREATE POLICY "Order parties and admin can view payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND (
                orders.business_id = auth.uid() OR
                orders.business_user_id = auth.uid() OR
                orders.creator_id = auth.uid() OR
                orders.creator_user_id = auth.uid()
            )
        )
        OR payer_user_id = auth.uid()
        OR public.is_admin()
    );

-- 8. Server-side RPC: record_payment_order
CREATE OR REPLACE FUNCTION public.record_payment_order(
    p_order_id UUID,
    p_razorpay_order_id TEXT,
    p_amount NUMERIC(10, 2),
    p_currency TEXT DEFAULT 'INR',
    p_payer_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_caller_id UUID;
    v_payment_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        v_caller_id := p_payer_user_id;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- Check if caller is the business owner
    IF v_caller_id IS NOT NULL AND v_caller_id != v_order.business_id AND v_caller_id != v_order.business_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the business owner of this order';
    END IF;

    IF v_order.payment_status = 'PAID' THEN
        RAISE EXCEPTION 'Order is already marked as PAID';
    END IF;

    -- Check if an existing payment record exists for this order
    SELECT * INTO v_payment FROM public.payments
    WHERE order_id = p_order_id
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND AND v_payment.status != 'PAID' THEN
        UPDATE public.payments
        SET razorpay_order_id = p_razorpay_order_id,
            amount = p_amount,
            currency = p_currency,
            status = 'PENDING',
            payer_user_id = COALESCE(v_caller_id, v_order.business_user_id),
            updated_at = v_now
        WHERE id = v_payment.id
        RETURNING id INTO v_payment_id;
    ELSE
        INSERT INTO public.payments (
            order_id,
            payer_user_id,
            provider,
            provider_payment_id,
            razorpay_order_id,
            amount,
            currency,
            status,
            created_at,
            updated_at
        ) VALUES (
            p_order_id,
            COALESCE(v_caller_id, v_order.business_user_id),
            'razorpay',
            p_razorpay_order_id,
            p_razorpay_order_id,
            p_amount,
            p_currency,
            'PENDING',
            v_now,
            v_now
        )
        RETURNING id INTO v_payment_id;
    END IF;

    -- Update order payment_status to PENDING
    UPDATE public.orders
    SET payment_status = 'PENDING',
        updated_at = v_now
    WHERE id = p_order_id AND payment_status != 'PAID';

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'razorpay_order_id', p_razorpay_order_id,
        'order_id', p_order_id
    );
END;
$$;

-- 9. Server-side RPC: verify_and_confirm_payment
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
            'status', 'PAID'
        );
    END IF;

    -- Update payment record to PAID
    UPDATE public.payments
    SET status = 'PAID',
        razorpay_payment_id = p_razorpay_payment_id,
        provider_payment_id = p_razorpay_payment_id,
        razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
        paid_at = v_now,
        updated_at = v_now,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'payment_method', p_payment_method,
            'verified_at', v_now
        )
    WHERE id = v_payment.id;

    -- Update order to canonical PAID state
    UPDATE public.orders
    SET order_status = 'PAID',
        payment_status = 'PAID',
        updated_at = v_now
    WHERE id = v_order.id;

    -- Create audit log in order_events
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
        COALESCE(v_actor_id, v_payment.payer_user_id, v_order.business_user_id),
        'PAYMENT_VERIFIED',
        v_order.order_status,
        'PAID',
        'Payment verified via Razorpay Standard Gateway. Creator notified to start work.',
        jsonb_build_object(
            'razorpay_order_id', p_razorpay_order_id,
            'razorpay_payment_id', p_razorpay_payment_id,
            'amount', v_payment.amount
        ),
        v_now
    );

    -- Notify Creator that payment has been received
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
        'PAYMENT_STATUS_CHANGED',
        'Payment Received!',
        'Payment confirmed for Order #' || v_order.order_number || '. You can now start the work.',
        v_now
    );

    -- Send system message in conversation if linked
    SELECT * INTO v_conv FROM public.conversations WHERE order_id = v_order.id LIMIT 1;
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
            v_order.id,
            COALESCE(v_actor_id, v_order.business_user_id),
            COALESCE(v_actor_id, v_order.business_user_id),
            'system',
            '✓ Payment verified (₹' || v_order.total_amount || '). The creator can now start work.',
            '✓ Payment verified (₹' || v_order.total_amount || '). The creator can now start work.',
            'clean',
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_paid', false,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'status', 'PAID'
    );
END;
$$;

-- 10. Server-side RPC: record_payment_failure
CREATE OR REPLACE FUNCTION public.record_payment_failure(
    p_razorpay_order_id TEXT,
    p_reason TEXT DEFAULT 'Payment failed or cancelled by user',
    p_error_code TEXT DEFAULT NULL,
    p_error_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_actor_id UUID := auth.uid();
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE razorpay_order_id = p_razorpay_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
    END IF;

    -- If already paid, do not revert to failed
    IF v_payment.status = 'PAID' THEN
        RETURN jsonb_build_object('success', true, 'status', 'PAID');
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id;

    -- Update payment record to FAILED
    UPDATE public.payments
    SET status = 'FAILED',
        failure_reason = p_reason,
        updated_at = v_now,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'error_code', p_error_code,
            'error_description', p_error_description,
            'failed_at', v_now
        )
    WHERE id = v_payment.id;

    -- Update order payment_status to FAILED, order remains in payment-required state (DEAL_CONFIRMED)
    IF FOUND AND v_order.payment_status != 'PAID' THEN
        UPDATE public.orders
        SET payment_status = 'FAILED',
            updated_at = v_now
        WHERE id = v_order.id;

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
            'PAYMENT_FAILED',
            v_order.payment_status,
            'FAILED',
            p_reason,
            jsonb_build_object(
                'razorpay_order_id', p_razorpay_order_id,
                'error_code', p_error_code,
                'error_description', p_error_description
            ),
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'FAILED',
        'order_id', v_payment.order_id
    );
END;
$$;

-- 11. Ensure mark_work_started rejects non-PAID orders strictly
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

-- 12. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
