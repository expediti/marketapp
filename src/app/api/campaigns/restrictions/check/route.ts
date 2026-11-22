import { NextResponse } from 'next/server';
import { getAuthenticatedUser, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/restrictions/check?creatorId=...&action=(send_request|accept_request|confirm_deal)
 * Validates whether a creator is eligible for campaign actions:
 * - Payout profile must exist.
 * - verification_status must be 'VERIFIED'.
 * - cashfree_vendor_id must be present.
 */
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId') || user.id;
    const action = searchParams.get('action') || 'action';

    const serviceClient = createServiceClient();
    const { data: payoutProfile, error: dbError } = await serviceClient
      .from('creator_payout_profiles')
      .select('verification_status, cashfree_vendor_id')
      .eq('user_id', creatorId)
      .maybeSingle();

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to query creator verification status.' },
        { status: 500 }
      );
    }

    const isVerified =
      payoutProfile?.verification_status === 'VERIFIED' &&
      Boolean(payoutProfile?.cashfree_vendor_id && payoutProfile.cashfree_vendor_id.trim());

    if (!isVerified) {
      let actionLabel = 'proceed with this campaign operation';
      if (action === 'send_request') actionLabel = 'send a campaign request';
      else if (action === 'accept_request') actionLabel = 'accept a campaign request';
      else if (action === 'confirm_deal') actionLabel = 'confirm a campaign deal';

      return NextResponse.json({
        eligible: false,
        verificationStatus: payoutProfile?.verification_status || 'NOT_CONFIGURED',
        error: `Creator bank payout setup is required before you can ${actionLabel}. Please complete bank verification in Settings → Payouts.`,
        settingsUrl: '/dashboard/creator?tab=settings&section=payouts',
      });
    }

    return NextResponse.json({
      eligible: true,
      verificationStatus: 'VERIFIED',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error validating campaign eligibility';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

