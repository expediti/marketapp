-- Migration 038: Creator KYC & Cashfree Easy Split Production Fields
-- Adds phone, pan_number to creator_payout_profiles, phone to profiles, and drops legacy bank constraints

ALTER TABLE public.creator_payout_profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- Make bank-specific columns nullable for UPI-only onboarding
ALTER TABLE public.creator_payout_profiles 
    ALTER COLUMN bank_account_last4 DROP NOT NULL;

ALTER TABLE public.creator_payout_profiles 
    ALTER COLUMN ifsc_code DROP NOT NULL;

-- Ensure profiles table has phone column
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for quick lookup by PAN
CREATE INDEX IF NOT EXISTS idx_creator_payout_profiles_pan ON public.creator_payout_profiles(pan_number);
CREATE INDEX IF NOT EXISTS idx_creator_payout_profiles_phone ON public.creator_payout_profiles(phone);

