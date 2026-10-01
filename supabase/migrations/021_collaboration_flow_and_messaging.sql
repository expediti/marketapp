-- ============================================================================
-- 021_collaboration_flow_and_messaging.sql
-- COMPLETE COLLABORATION REQUESTS, CONVERSATIONS, MESSAGING & ORDER WORKFLOW
--
-- Features:
-- 1. Creates 'public.collaboration_requests' table with statuses:
--    (PENDING, ACCEPTED, DECLINED, CANCELLED, EXPIRED)
-- 2. Strict Row-Level Security (RLS) for collaboration requests:
--    - Business can INSERT where business_user_id = auth.uid()
--    - Business can SELECT where business_user_id = auth.uid()
--    - Business can UPDATE (cancel) where business_user_id = auth.uid() AND status = 'PENDING'
--    - Creator can SELECT where creator_user_id = auth.uid()
--    - Creator can UPDATE (accept/decline) where creator_user_id = auth.uid()
--    - Admin has management access
-- 3. Extends 'public.conversations' to support pre-order collaboration chat:
--    - Drops NOT NULL constraint on order_id
--    - Adds request_id, business_user_id, creator_user_id
--    - RLS allows only participants (business_user_id, creator_user_id) to SELECT/INSERT/UPDATE
-- 4. Extends 'public.messages':
--    - Adds sender_user_id, message alias columns with synchronization trigger
--    - RLS permits only conversation participants to view and send messages
-- 5. Extends 'public.orders':
--    - Adds request_id, business_user_id, creator_user_id
--    - Synchronization trigger ensuring business_id = business_user_id and creator_id = creator_user_id
--    - RLS permits both Business (business_id / business_user_id) and Creator (creator_id / creator_user_id) to SELECT & UPDATE
-- 6. Configures Supabase Realtime publication for realtime chat and request notifications
-- 7. Reloads PostgREST schema cache
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COLLABORATION REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    package_id UUID REFERENCES public.creator_packages(id) ON DELETE SET NULL,
    message TEXT,
    proposed_budget NUMERIC(10, 2) CHECK (proposed_budget IS NULL OR proposed_budget >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for collaboration requests
CREATE INDEX IF NOT EXISTS idx_collab_req_business ON public.collaboration_requests(business_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_creator ON public.collaboration_requests(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_campaign ON public.collaboration_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_package ON public.collaboration_requests(package_id);
CREATE INDEX IF NOT EXISTS idx_collab_req_status ON public.collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_collab_req_created_at ON public.collaboration_requests(created_at DESC);

-- Unique index to prevent duplicate pending requests for the same business + creator + package
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_req_active_unique
    ON public.collaboration_requests(business_user_id, creator_user_id, COALESCE(package_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE (status = 'PENDING');

-- Updated_at trigger
DROP TRIGGER IF EXISTS on_collab_requests_updated ON public.collaboration_requests;
CREATE TRIGGER on_collab_requests_updated
    BEFORE UPDATE ON public.collaboration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Business can view requests they sent
DROP POLICY IF EXISTS "Businesses can view sent requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can view sent requests"
    ON public.collaboration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = business_user_id OR public.is_admin());

-- Creator can view requests they received
DROP POLICY IF EXISTS "Creators can view received requests" ON public.collaboration_requests;
CREATE POLICY "Creators can view received requests"
    ON public.collaboration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = creator_user_id OR public.is_admin());

-- Business can create requests where business_user_id = auth.uid()
DROP POLICY IF EXISTS "Businesses can create requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can create requests"
    ON public.collaboration_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = business_user_id OR public.is_admin());

-- Creator can accept or decline their received requests
DROP POLICY IF EXISTS "Creators can respond to requests" ON public.collaboration_requests;
CREATE POLICY "Creators can respond to requests"
    ON public.collaboration_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_user_id OR public.is_admin())
    WITH CHECK (auth.uid() = creator_user_id OR public.is_admin());

-- Business can cancel their own pending requests
DROP POLICY IF EXISTS "Businesses can cancel pending requests" ON public.collaboration_requests;
CREATE POLICY "Businesses can cancel pending requests"
    ON public.collaboration_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_user_id AND status = 'PENDING')
    WITH CHECK (auth.uid() = business_user_id);

-- ----------------------------------------------------------------------------
-- 2. RECONCILE CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Allow conversations before orders are finalized
ALTER TABLE public.conversations ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_order_id_key;

-- Add new participant and request columns
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS business_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Backfill participants from orders if existing
UPDATE public.conversations c
SET
    business_user_id = o.business_id,
    creator_user_id = o.creator_id
FROM public.orders o
WHERE c.order_id = o.id
AND (c.business_user_id IS NULL OR c.creator_user_id IS NULL);

-- Indexes & Unique constraints
CREATE INDEX IF NOT EXISTS idx_conversations_business_user_id ON public.conversations(business_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_user_id ON public.conversations(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON public.conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON public.conversations(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_request_id_unique ON public.conversations(request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_order_id_unique ON public.conversations(order_id) WHERE order_id IS NOT NULL;

-- Trigger to update updated_at on conversations
DROP TRIGGER IF EXISTS on_conversations_updated ON public.conversations;
CREATE TRIGGER on_conversations_updated
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order parties can view conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
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
                AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
            )
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 3. RECONCILE MESSAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    moderation_status TEXT NOT NULL DEFAULT 'clean' CHECK (moderation_status IN ('clean', 'flagged', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMPTZ
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Sync trigger between body & message, sender_id & sender_user_id
CREATE OR REPLACE FUNCTION public.handle_message_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sender_id IS NULL AND NEW.sender_user_id IS NOT NULL THEN
        NEW.sender_id := NEW.sender_user_id;
    ELSIF NEW.sender_user_id IS NULL AND NEW.sender_id IS NOT NULL THEN
        NEW.sender_user_id := NEW.sender_id;
    END IF;

    IF NEW.body IS NULL AND NEW.message IS NOT NULL THEN
        NEW.body := NEW.message;
    ELSIF NEW.message IS NULL AND NEW.body IS NOT NULL THEN
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

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order parties can view messages" ON public.messages;
DROP POLICY IF EXISTS "Order parties can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
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
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
        )
    );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        (sender_id = auth.uid() OR sender_user_id = auth.uid())
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
                        AND (o.business_id = auth.uid() OR o.creator_id = auth.uid())
                    )
                )
                OR public.is_admin()
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 4. RECONCILE ORDERS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS business_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Sync trigger for orders (ensuring both business_id & business_user_id, creator_id & creator_user_id are filled)
CREATE OR REPLACE FUNCTION public.handle_order_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.business_user_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.business_user_id := NEW.business_id;
    ELSIF NEW.business_id IS NULL AND NEW.business_user_id IS NOT NULL THEN
        NEW.business_id := NEW.business_user_id;
    END IF;

    IF NEW.creator_user_id IS NULL AND NEW.creator_id IS NOT NULL THEN
        NEW.creator_user_id := NEW.creator_id;
    ELSIF NEW.creator_id IS NULL AND NEW.creator_user_id IS NOT NULL THEN
        NEW.creator_id := NEW.creator_user_id;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_sync ON public.orders;
CREATE TRIGGER on_order_sync
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_sync();

-- Backfill existing orders
UPDATE public.orders SET business_user_id = business_id WHERE business_user_id IS NULL;
UPDATE public.orders SET creator_user_id = creator_id WHERE creator_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_business_user_id ON public.orders(business_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_user_id ON public.orders(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_request_id ON public.orders(request_id);

-- Update RLS on orders to recognize both naming conventions
DROP POLICY IF EXISTS "Users can view orders they are involved in" ON public.orders;
CREATE POLICY "Users can view orders they are involved in"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        auth.uid() = business_id
        OR auth.uid() = creator_id
        OR auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Businesses can create orders" ON public.orders;
CREATE POLICY "Businesses can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = business_id
        OR auth.uid() = business_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Parties involved can update orders" ON public.orders;
CREATE POLICY "Parties involved can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = business_id
        OR auth.uid() = creator_id
        OR auth.uid() = business_user_id
        OR auth.uid() = creator_user_id
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ----------------------------------------------------------------------------
-- 6. NOTIFY POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
