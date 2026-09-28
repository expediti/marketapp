-- 014_rls.sql
-- Row Level Security policies for secure multi-tenant role-based access

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Creator Profiles
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator profiles are viewable by everyone"
    ON public.creator_profiles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Creators can update own creator profile"
    ON public.creator_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Creators can insert own creator profile"
    ON public.creator_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 3. Creator Samples
ALTER TABLE public.creator_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Samples are viewable by everyone"
    ON public.creator_samples FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Creators can manage own samples"
    ON public.creator_samples FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 4. Business Profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business profiles are viewable by authenticated users"
    ON public.business_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Businesses can update own business profile"
    ON public.business_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Businesses can insert own business profile"
    ON public.business_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 5. Creator Packages
ALTER TABLE public.creator_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active packages are viewable by everyone"
    ON public.creator_packages FOR SELECT
    TO anon, authenticated
    USING (active = true OR auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "Creators can manage own packages"
    ON public.creator_packages FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 6. Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders they are involved in"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = business_id OR auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "Businesses can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = business_id OR public.is_admin());

CREATE POLICY "Parties involved can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (auth.uid() = business_id OR auth.uid() = creator_id OR public.is_admin());

-- 7. Order Briefs
ALTER TABLE public.order_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view briefs"
    ON public.order_briefs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Businesses can create briefs"
    ON public.order_briefs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_briefs.order_id
            AND orders.business_id = auth.uid()
        ) OR public.is_admin()
    );

-- 8. Order Events
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view order events"
    ON public.order_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_events.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Order parties can insert order events"
    ON public.order_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_events.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 9. Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties and admin can view payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 10. Payouts (Creator and Admin only, never Business)
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own payouts"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (auth.uid() = creator_id OR public.is_admin());

-- 11. Deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view deliveries"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = deliveries.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Creators can submit deliveries"
    ON public.deliveries FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = deliveries.order_id
            AND orders.creator_id = auth.uid()
        ) OR public.is_admin()
    );

-- 12. Disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties and admin can view disputes"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = disputes.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Businesses can open disputes"
    ON public.disputes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = disputes.order_id
            AND orders.business_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Admin can update disputes"
    ON public.disputes FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- 13. Conversations and Messages
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view conversation"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = conversations.order_id
            AND (orders.business_id = auth.uid() OR orders.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Order parties can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.orders o ON o.id = c.order_id
            WHERE c.id = messages.conversation_id
            AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Order parties can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.orders o ON o.id = c.order_id
            WHERE c.id = messages.conversation_id
            AND (o.business_id = auth.uid() OR o.creator_id = auth.uid() OR public.is_admin())
        )
    );

-- 14. Admin Actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access admin actions"
    ON public.admin_actions FOR ALL
    TO authenticated
    USING (public.is_admin());
