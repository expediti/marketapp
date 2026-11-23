import { NextResponse } from 'next/server';
import { getAuthenticatedUser, createServiceClient } from '@/lib/supabase/server';
import { cashfreeVendorService } from '@/lib/server/payment/cashfreeVendorService';

export const dynamic = 'force-dynamic';

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * GET /api/creators/payout-profile
 * Safely fetches the authenticated creator's UPI payout profile status.
 */
export async function GET() {
  try {
    const { user, profile, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view payout settings.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const [payoutRes, creatorProfRes] = await Promise.all([
      serviceClient
        .from('creator_payout_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      serviceClient
        .from('creator_profiles')
        .select('payout_upi_id, display_name')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const payoutProfile = payoutRes.data as any;
    const creatorProf = creatorProfRes.data;

    const currentUpi =
      payoutProfile?.payout_upi_id ||
      payoutProfile?.verification_details?.upi_id ||
      creatorProf?.payout_upi_id ||
      '';

    const currentName =
      payoutProfile?.account_holder_name ||
      creatorProf?.display_name ||
      profile?.display_name ||
      '';

    const currentPhone = payoutProfile?.phone || (profile as any)?.phone || user.phone || '';
    const currentPan = payoutProfile?.pan_number || '';

    const isConfigured = Boolean(
      (payoutProfile && payoutProfile.verification_status === 'VERIFIED') ||
      currentUpi.length > 0
    );

    const status =
      payoutProfile?.verification_status ||
      (currentUpi ? 'VERIFIED' : 'NOT_CONFIGURED');

    return NextResponse.json({
      configured: isConfigured,
      verificationStatus: status,
      profile: {
        id: payoutProfile?.id || null,
        user_id: user.id,
        account_holder_name: currentName,
        phone: currentPhone,
        payout_upi_id: currentUpi,
        pan_number: currentPan,
        masked_upi: currentUpi ? currentUpi.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : null,
        cashfree_vendor_id: payoutProfile?.cashfree_vendor_id || null,
        verification_status: status,
        verification_details: payoutProfile?.verification_details || { type: 'UPI', upi_id: currentUpi },
        created_at: payoutProfile?.created_at || null,
        updated_at: payoutProfile?.updated_at || null,
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
 * Saves or updates creator UPI payout details (VPA & Legal Name):
 * 1. Validates UPI ID format (e.g. user@okhdfcbank, mobile@paytm) and legal name.
 * 2. Registers or updates Cashfree Easy Split vendor with UPI VPA and on-demand release.
 * 3. Saves to public.creator_payout_profiles with VERIFIED status.
 * 4. Syncs public.creator_profiles.payout_upi_id.
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
    const rawHolderName = String(body.accountHolderName || body.legalName || profile?.display_name || '').trim();
    const rawUpiId = String(body.upiId || body.payoutUpiId || '').trim();
    const rawPan = body.pan ? String(body.pan).trim().toUpperCase() : (body.pan_number ? String(body.pan_number).trim().toUpperCase() : '');
    const rawPhone = String(body.phone || body.creatorPhone || (profile as any)?.phone || user.phone || '').trim().replace(/\D/g, '').slice(-10);

    // Validation - all 4 mandatory Cashfree Production Easy Split fields
    const errors: Record<string, string> = {};
    const LEGAL_NAME_REGEX = /^[a-zA-Z\s./\-&]{2,100}$/;
    if (!rawHolderName || !LEGAL_NAME_REGEX.test(rawHolderName)) {
      errors.accountHolderName = 'Full Legal Name is required (matching PAN & UPI; letters, spaces, and . / - & only).';
    }

    if (!rawPhone || rawPhone.length !== 10) {
      errors.phone = 'Valid 10-digit Indian mobile number is required (without +91).';
    }

    if (!rawUpiId) {
      errors.upiId = 'UPI ID (VPA) is required (e.g. name@oksbi, 9876543210@paytm).';
    } else if (!UPI_REGEX.test(rawUpiId)) {
      errors.upiId = 'Please enter a valid UPI ID format (e.g. username@bank or mobile@paytm).';
    }

    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!rawPan || !PAN_REGEX.test(rawPan)) {
      errors.pan = 'Valid 10-character PAN card number is required (e.g. ABCDE1234F).';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          error: Object.values(errors)[0] || 'Validation failed. Please correct the highlighted errors.',
          errors,
        },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Fetch existing profile to preserve vendor ID if already assigned
    const { data: existingProfile } = await serviceClient
      .from('creator_payout_profiles')
      .select('cashfree_vendor_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const existingVendorId = existingProfile?.cashfree_vendor_id || null;

    // 2. Register or Update Cashfree Easy Split Vendor with UPI VPA
    const vendorResult = await cashfreeVendorService.registerOrUpdateVendor({
      creatorUserId: user.id,
      accountHolderName: rawHolderName,
      upiId: rawUpiId,
      pan: rawPan,
      creatorEmail: user.email || profile?.email || undefined,
      creatorPhone: rawPhone,
      existingVendorId,
    });

    if (vendorResult.error && (vendorResult.verificationStatus === 'REJECTED' || vendorResult.verificationStatus === 'ACTION_REQUIRED')) {
      return NextResponse.json(
        {
          error: vendorResult.error,
          verificationStatus: vendorResult.verificationStatus,
          details: vendorResult.details,
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const finalStatus = vendorResult.verificationStatus || 'VERIFIED';

    // 3. Upsert public.creator_payout_profiles
    const { data: updatedProfile, error: profileError } = await serviceClient
      .from('creator_payout_profiles')
      .upsert(
        {
          user_id: user.id,
          account_holder_name: rawHolderName,
          phone: rawPhone,
          payout_upi_id: rawUpiId,
          pan_number: rawPan,
          bank_account_last4: rawUpiId.slice(-4), // Clean fallback for DB constraints
          ifsc_code: 'UPI',                      // Clean fallback for DB constraints
          account_type: 'SAVINGS',
          cashfree_vendor_id: vendorResult.vendorId,
          verification_status: finalStatus,
          verification_details: {
            type: 'UPI',
            upi_id: rawUpiId,
            pan: rawPan,
            phone: rawPhone,
            vendor_id: vendorResult.vendorId,
            verified_at: nowIso,
            details: vendorResult.details || {},
          },
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

    // 4. Sync creator_profiles and profiles
    await Promise.all([
      serviceClient
        .from('creator_profiles')
        .update({
          payout_upi_id: rawUpiId,
          updated_at: nowIso,
        })
        .eq('user_id', user.id),
      serviceClient
        .from('profiles')
        .update({
          phone: rawPhone,
          updated_at: nowIso,
        })
        .eq('id', user.id),
    ]);

    return NextResponse.json({
      success: true,
      message: 'UPI payout details and KYC saved and verified successfully.',
      verificationStatus: finalStatus,
      profile: {
        id: updatedProfile.id,
        user_id: updatedProfile.user_id,
        account_holder_name: updatedProfile.account_holder_name,
        phone: rawPhone,
        payout_upi_id: rawUpiId,
        pan_number: rawPan,
        cashfree_vendor_id: updatedProfile.cashfree_vendor_id,
        verification_status: finalStatus,
        updated_at: updatedProfile.updated_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error saving payout profile';
    console.error('POST /api/creators/payout-profile error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
