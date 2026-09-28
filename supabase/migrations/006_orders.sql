-- 006_orders.sql
-- Collaboration orders and detailed campaign briefs

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.creator_packages(id) ON DELETE RESTRICT,
    order_status TEXT NOT NULL DEFAULT 'FUNDED' CHECK (
        order_status IN (
            'DRAFT',
            'PAYMENT_PENDING',
            'FUNDED',
            'CREATOR_PENDING',
            'ACCEPTED',
            'IN_PROGRESS',
            'DELIVERED',
            'APPROVED',
            'DISPUTED',
            'ADMIN_REVIEW',
            'REFUND_PENDING',
            'REFUNDED',
            'PAYOUT_PENDING',
            'PAID',
            'CANCELLED',
            'COMPLETED'
        )
    ),
    payment_status TEXT NOT NULL DEFAULT 'FUNDED' CHECK (
        payment_status IN ('PENDING', 'FUNDED', 'REFUNDED', 'FAILED')
    ),
    payout_status TEXT NOT NULL DEFAULT 'UNRELEASED' CHECK (
        payout_status IN ('UNRELEASED', 'PAYOUT_PENDING', 'PAID', 'HELD', 'CANCELLED')
    ),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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
