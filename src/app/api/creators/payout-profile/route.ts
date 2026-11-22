import { NextResponse } from 'next/server';
import { getAuthenticatedUser, createServiceClient } from '@/lib/supabase/server';
import { validateBankDetails } from '@/lib/utils/bankValidation';
import { encryptBankPayload } from '@/lib/server/security/payoutEncryption';
import { cashfreeVendorService } from '@/lib/server/payment/cashfreeVendorService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/creators/payout-profile
 * Safely fetches the authenticated creator's payout profile status.
 * Never exposes full account numbers or encrypted payloads.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view payout settings.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: payoutProfile, error: dbError } = await serviceClient
      .from('creator_payout_profiles')
      .select('id, user_id, account_holder_name, bank_account_last4, ifsc_code, account_type, cashfree_vendor_id, verification_status, verification_details, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('Error fetching creator payout profile:', dbError);
      return NextResponse.json(
        { error: 'Failed to retrieve payout profile.' },
        { status: 500 }
      );
    }

    if (!payoutProfile) {
      return NextResponse.json({
        configured: false,
        verificationStatus: 'NOT_CONFIGURED',
        profile: null,
      });
    }

    const last4 = payoutProfile.bank_account_last4 || '';
    const maskedAccountNumber = `XXXX${last4}`;

    return NextResponse.json({
      configured: true,
      verificationStatus: payoutProfile.verification_status,
      profile: {
        id: payoutProfile.id,
        user_id: payoutProfile.user_id,
        account_holder_name: payoutProfile.account_holder_name,
        bank_account_last4: last4,
        masked_account_number: maskedAccountNumber,
        ifsc_code: payoutProfile.ifsc_code,
        account_type: payoutProfile.account_type,
        cashfree_vendor_id: payoutProfile.cashfree_vendor_id ? `cf_***${payoutProfile.cashfree_vendor_id.slice(-4)}` : null,
        verification_status: payoutProfile.verification_status,
        verification_details: payoutProfile.verification_details,
        created_at: payoutProfile.created_at,
        updated_at: payoutProfile.updated_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error fetching payout profile';
    console.error('GET /api/creators/payout-profile error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/creators/payout-profile
 * Saves or updates creator bank account details:
 * 1. Validates bank inputs (IFSC, account number, name, matching confirmation).
 * 2. Encrypts sensitive details using AES-256-GCM.
 * 3. Saves encrypted payload to public.creator_payout_secrets.
 * 4. Invokes Cashfree vendor registration / verification API.
 * 5. Saves safe profile and verification status to public.creator_payout_profiles.
 */
export async function POST(request: Request) {
  try {
    const { user, profile, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBankDetails(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed. Please correct the highlighted errors.',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      bankAccountLast4,
      maskedAccountNumber,
    } = validation.cleaned;

    const serviceClient = createServiceClient();

    // 1. Fetch existing profile to preserve stable vendor ID if already assigned
    const { data: existingProfile } = await serviceClient
      .from('creator_payout_profiles')
      .select('cashfree_vendor_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const existingVendorId = existingProfile?.cashfree_vendor_id || null;

    // 2. Encrypt bank payload via AES-256-GCM
    const nowIso = new Date().toISOString();
    const encryptedPayload = await encryptBankPayload({
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      timestamp: nowIso,
    });

    // 3. Save to public.creator_payout_secrets using service-role client
    const { error: secretError } = await serviceClient
      .from('creator_payout_secrets')
      .upsert(
        {
          user_id: user.id,
          encrypted_payload: encryptedPayload,
          key_version: 'v1',
          updated_at: nowIso,
        },
        { onConflict: 'user_id' }
      );

    if (secretError) {
      console.error('Failed to store creator payout secrets securely:', secretError.message);
      return NextResponse.json(
        { error: 'Failed to securely store payout credentials.' },
        { status: 500 }
      );
    }

    // 4. Register or Update Cashfree Easy Split Vendor
    const vendorResult = await cashfreeVendorService.registerOrUpdateVendor({
      creatorUserId: user.id,
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      creatorEmail: user.email || profile?.email || undefined,
      existingVendorId,
    });

    // 5. Upsert public.creator_payout_profiles
    const { data: updatedProfile, error: profileError } = await serviceClient
      .from('creator_payout_profiles')
      .upsert(
        {
          user_id: user.id,
          account_holder_name: accountHolderName,
          bank_account_last4: bankAccountLast4,
          ifsc_code: ifscCode,
          account_type: accountType,
          cashfree_vendor_id: vendorResult.vendorId,
          verification_status: vendorResult.verificationStatus,
          verification_details: vendorResult.details || {},
          updated_at: nowIso,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Failed to update creator payout profile:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to update payout profile record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        vendorResult.verificationStatus === 'VERIFIED'
          ? 'Bank account successfully verified.'
          : 'Bank details saved. Verification is in progress.',
      verificationStatus: vendorResult.verificationStatus,
      profile: {
        id: updatedProfile.id,
        user_id: updatedProfile.user_id,
        account_holder_name: updatedProfile.account_holder_name,
        bank_account_last4: bankAccountLast4,
        masked_account_number: maskedAccountNumber,
        ifsc_code: updatedProfile.ifsc_code,
        account_type: updatedProfile.account_type,
        verification_status: updatedProfile.verification_status,
        updated_at: updatedProfile.updated_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error saving payout profile';
    console.error('POST /api/creators/payout-profile error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

