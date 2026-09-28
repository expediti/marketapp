-- 005_creator_packages.sql
-- Fixed collaboration packages offered by creators

CREATE TABLE IF NOT EXISTS public.creator_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creator_profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    revision_count INTEGER NOT NULL DEFAULT 1 CHECK (revision_count >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER on_creator_packages_updated
    BEFORE UPDATE ON public.creator_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
