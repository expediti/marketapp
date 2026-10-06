import { NextResponse } from 'next/server';
import { getAuthenticatedUser, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { user, profile, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to delete your account.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const userId = user.id;

    // Check for active / unsettled orders that prevent immediate deletion
    // Active statuses: PAID, WORK_STARTED, IN_PROGRESS, DELIVERED, REVISION_REQUESTED, DISPUTED
    const { data: activeOrders, error: ordersError } = await serviceClient
      .from('orders')
      .select('id, order_status, payment_status')
      .or(`creator_user_id.eq.${userId},business_user_id.eq.${userId},creator_id.eq.${userId},business_id.eq.${userId}`)
      .in('order_status', [
        'PAID',
        'WORK_STARTED',
        'IN_PROGRESS',
        'DELIVERED',
        'REVISION_REQUESTED',
        'DISPUTED',
      ]);

    if (ordersError) {
      console.error('[Account Deletion] Error checking active orders:', ordersError);
    }

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        {
          error: `You have ${activeOrders.length} active order(s) in progress. Please complete, resolve, or cancel active collaborations before deleting your account.`,
        },
        { status: 400 }
      );
    }

    // 1. Anonymize user profile in public.profiles
    const anonymizedEmail = `deleted_${userId.substring(0, 8)}@deleted.marketmyidea.local`;
    await serviceClient
      .from('profiles')
      .update({
        display_name: 'Deleted User',
        email: anonymizedEmail,
        avatar_url: null,
        city: null,
      })
      .eq('id', userId);

    // 2. Anonymize creator_profiles if creator
    await serviceClient
      .from('creator_profiles')
      .update({
        display_name: 'Deleted Creator',
        bio: 'Account closed by user.',
        profile_image_path: null,
        instagram_connected: false,
        instagram_verified: false,
        instagram_user_id: null,
        instagram_username: null,
        instagram_access_token: null,
        instagram_profile_data: null,
        payout_upi_id: null,
        verification_status: 'deleted',
      })
      .eq('user_id', userId);

    // 3. Anonymize business_profiles if business
    await serviceClient
      .from('business_profiles')
      .update({
        business_name: 'Deleted Business',
        description: null,
        logo_path: null,
        website: null,
        app_url: null,
        verification_status: 'deleted',
      })
      .eq('user_id', userId);

    // 4. Archive/deactivate active campaigns created by this business
    await serviceClient
      .from('campaigns')
      .update({
        status: 'ARCHIVED',
      })
      .eq('business_id', userId);

    // 5. Delete or remove creator reels
    try {
      await serviceClient
        .from('creator_reels')
        .delete()
        .eq('creator_id', userId);
    } catch {
      // Ignore if table or foreign key differs
    }

    // 6. Delete user from auth.users via Supabase Admin API
    const { error: deleteUserError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.warn('[Account Deletion] Auth deleteUser warning (profile anonymized):', deleteUserError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted and personal data removed.',
    });
  } catch (err: any) {
    console.error('[Account Deletion] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process account deletion request.' },
      { status: 500 }
    );
  }
}
