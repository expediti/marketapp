-- ============================================================================
-- 028_creator_payout_upi_id.sql
-- Add creator payout UPI ID column for manual creator payouts
-- ============================================================================
-- IMPORTANT ARCHITECTURAL CONSTRAINTS:
-- 1. This is strictly for FUTURE MANUAL creator payouts.
-- 2. NO automatic payouts, NO RazorpayX API payouts, NO escrow, NO Razorpay Route.
-- 3. NO automatic payout trigger when order status transitions to COMPLETED.
-- 4. Payout is manually initiated by the Market My App platform owner via the RazorpayX Dashboard.
-- 5. Businesses must NEVER see the creator's payout UPI ID.
-- 6. Payout UPI ID is NEVER exposed in public creator discovery/profile APIs.
-- ============================================================================

-- 1. Safely add payout_upi_id to public.creator_profiles if it does not already exist
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS payout_upi_id TEXT;

-- 2. Add documentation comments on table & column explaining manual payout workflow
COMMENT ON COLUMN public.creator_profiles.payout_upi_id IS
'Creator payout UPI ID (VPA) for manual payouts initiated via RazorpayX Dashboard. Strictly private to creator and platform owner. Never exposed to businesses or public discovery.';

-- 3. Ensure RLS is enabled on creator_profiles
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Secure helper RPC for authenticated creator to fetch their own payout UPI ID
CREATE OR REPLACE FUNCTION public.get_my_payout_upi_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_upi TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT payout_upi_id INTO v_upi
    FROM public.creator_profiles
    WHERE user_id = auth.uid();

    RETURN v_upi;
END;
$$;

-- 5. Secure helper RPC for authenticated creator to update their own payout UPI ID
CREATE OR REPLACE FUNCTION public.update_my_payout_upi_id(p_upi_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_upi TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Basic formatting and normalization: trim whitespace, lowercase, or NULL if empty
    v_clean_upi := NULLIF(lower(trim(p_upi_id)), '');

    UPDATE public.creator_profiles
    SET payout_upi_id = v_clean_upi,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = auth.uid();

    RETURN jsonb_build_object('success', true, 'payout_upi_id', v_clean_upi);
END;
$$;

-- 6. Grant execute permissions on helper RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_payout_upi_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_payout_upi_id(TEXT) TO authenticated;

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
