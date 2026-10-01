-- ============================================================================
-- 022_messaging_audit_and_notification_system.sql
-- COMPLETE MESSAGING FIX, PARTICIPANT SECURITY, REALTIME & IN-APP NOTIFICATIONS
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATIONS TABLE RECONCILIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    business_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Crucial: order_id MUST be nullable to support pre-order collaboration chat
ALTER TABLE public.conversations ALTER COLUMN order_id DROP NOT NULL;

-- Ensure all participant & link columns exist
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS business_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Indexes for lightning-fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_business_user_id ON public.conversations(business_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_user_id ON public.conversations(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON public.conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_request_id_unique ON public.conversations(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_order_id_unique ON public.conversations(order_id) WHERE order_id IS NOT NULL;

-- Updated_at trigger for conversations
DROP TRIGGER IF EXISTS on_conversations_updated ON public.conversations;
CREATE TRIGGER on_conversations_updated
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. MESSAGES TABLE RECONCILIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_role TEXT CHECK (sender_role IS NULL OR sender_role IN ('business', 'creator', 'advertiser', 'influencer', 'admin')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    body TEXT,
    message TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'clean' CHECK (moderation_status IN ('clean', 'flagged', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMPTZ
);

-- Ensure all required columns exist so PostgREST never fails with 400
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'clean';

-- Ensure sender_id can accept null on delete set null
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Bidirectional column synchronization trigger for messages (body <-> message, sender_id <-> sender_user_id)
CREATE OR REPLACE FUNCTION public.handle_message_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize sender identifiers
    IF NEW.sender_id IS NULL AND NEW.sender_user_id IS NOT NULL THEN
        NEW.sender_id := NEW.sender_user_id;
    ELSIF NEW.sender_user_id IS NULL AND NEW.sender_id IS NOT NULL THEN
        NEW.sender_user_id := NEW.sender_id;
    END IF;

    -- Synchronize text content
    IF NEW.body IS NULL AND NEW.message IS NOT NULL THEN
        NEW.body := NEW.message;
    ELSIF NEW.message IS NULL AND NEW.body IS NOT NULL THEN
        NEW.message := NEW.body;
    END IF;

    -- Fallback default for body if both empty
    IF NEW.body IS NULL THEN
        NEW.body := '';
    END IF;
    IF NEW.message IS NULL THEN
        NEW.message := NEW.body;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_messages_sync ON public.messages;
CREATE TRIGGER on_messages_sync
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_sync();

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR CONVERSATIONS & MESSAGES
-- ============================================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop all conflicting legacy policies
DROP POLICY IF EXISTS "Order parties can view conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

DROP POLICY IF EXISTS "Order parties can view messages" ON public.messages;
DROP POLICY IF EXISTS "Order parties can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;

-- CONVERSATIONS POLICIES
-- A user can view a conversation if they are the business or creator participant
CREATE POLICY "Participants can view conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR (
            order_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.orders o
                WHERE o.id = conversations.order_id
                AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid())
            )
        )
        OR public.is_admin()
    );

-- Participants or admins can create conversations
CREATE POLICY "Participants can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

-- Participants or admins can update conversation timestamps
CREATE POLICY "Participants can update conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

-- MESSAGES POLICIES
-- Phase 4: A user can read a message IF AND ONLY IF they are a participant in that conversation
-- (DO NOT use sender_id = auth.uid() on SELECT, which would block recipient!)
CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (
                c.business_user_id = auth.uid()
                OR c.creator_user_id = auth.uid()
                OR (
                    c.order_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM public.orders o
                        WHERE o.id = c.order_id
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
        )
    );

-- Phase 5: A user can insert a message ONLY when authenticated as the sender AND is a participant in that conversation
CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() = sender_id OR auth.uid() = sender_user_id)
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (
                c.business_user_id = auth.uid()
                OR c.creator_user_id = auth.uid()
                OR (
                    c.order_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM public.orders o
                        WHERE o.id = c.order_id
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR o.business_user_id = auth.uid() OR o.creator_user_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
        )
    );

-- ============================================================================
-- 4. IN-APP NOTIFICATIONS TABLE & AUTOMATIC TRIGGERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'NEW_MESSAGE',
            'COLLABORATION_REQUEST',
            'REQUEST_ACCEPTED',
            'REQUEST_DECLINED',
            'ORDER_CREATED',
            'ORDER_DELIVERED',
            'ORDER_APPROVED',
            'PAYMENT_STATUS_CHANGED',
            'SYSTEM'
        )
    ),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

-- Automated trigger: Notify recipient on new message
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_business_id UUID;
    v_creator_id UUID;
    v_recipient_id UUID;
    v_sender_name TEXT;
BEGIN
    -- Determine conversation participants
    SELECT business_user_id, creator_user_id
    INTO v_business_id, v_creator_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;

    -- Recipient is the other participant
    IF NEW.sender_user_id = v_business_id OR NEW.sender_id = v_business_id THEN
        v_recipient_id := v_creator_id;
    ELSIF NEW.sender_user_id = v_creator_id OR NEW.sender_id = v_creator_id THEN
        v_recipient_id := v_business_id;
    END IF;

    -- If recipient found, find sender display name
    IF v_recipient_id IS NOT NULL THEN
        SELECT COALESCE(display_name, 'Partner')
        INTO v_sender_name
        FROM public.profiles
        WHERE id = COALESCE(NEW.sender_user_id, NEW.sender_id);

        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_conversation_id,
            related_order_id
        ) VALUES (
            v_recipient_id,
            'NEW_MESSAGE',
            'New message from ' || COALESCE(v_sender_name, 'Partner'),
            COALESCE(SUBSTRING(COALESCE(NEW.body, NEW.message) FROM 1 FOR 120), 'You received a new message.'),
            NEW.conversation_id,
            NEW.order_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created_notify ON public.messages;
CREATE TRIGGER on_message_created_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_notification();

-- Automated trigger: Notify creator on incoming collaboration request
CREATE OR REPLACE FUNCTION public.handle_collab_request_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_name TEXT;
BEGIN
    SELECT COALESCE(business_name, 'A brand')
    INTO v_brand_name
    FROM public.business_profiles
    WHERE user_id = NEW.business_user_id;

    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        body
    ) VALUES (
        NEW.creator_user_id,
        'COLLABORATION_REQUEST',
        'New Collaboration Request',
        v_brand_name || ' sent you a collaboration request for ' || 
        CASE WHEN NEW.proposed_budget IS NOT NULL THEN '₹' || NEW.proposed_budget::TEXT ELSE 'your package' END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collab_request_created_notify ON public.collaboration_requests;
CREATE TRIGGER on_collab_request_created_notify
    AFTER INSERT ON public.collaboration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_collab_request_notification();

-- Automated trigger: Notify business when request is accepted
CREATE OR REPLACE FUNCTION public.handle_collab_request_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_name TEXT;
BEGIN
    IF OLD.status = 'PENDING' AND NEW.status = 'ACCEPTED' THEN
        SELECT COALESCE(display_name, 'Creator')
        INTO v_creator_name
        FROM public.profiles
        WHERE id = NEW.creator_user_id;

        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body
        ) VALUES (
            NEW.business_user_id,
            'REQUEST_ACCEPTED',
            'Collaboration Request Accepted!',
            v_creator_name || ' accepted your request. Private chat is now open to finalize details.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collab_request_updated_notify ON public.collaboration_requests;
CREATE TRIGGER on_collab_request_updated_notify
    AFTER UPDATE ON public.collaboration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_collab_request_update_notification();

-- ============================================================================
-- 5. ORDERS STATUS & LIFECYCLE RECONCILIATION
-- ============================================================================
-- Drop outdated check constraint on order_status to allow comprehensive lifecycle
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
        'DELIVERED',
        'APPROVED',
        'AUTO_APPROVED',
        'DISPUTED',
        'ADMIN_REVIEW',
        'REFUND_PENDING',
        'REFUNDED',
        'PAYOUT_PENDING',
        'PAID',
        'CANCELLED',
        'COMPLETED'
    )
);

-- ============================================================================
-- 6. SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY
-- ============================================================================
-- Full replica identity ensures WebSocket payloads include old and new records
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_requests REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ============================================================================
-- 7. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';
