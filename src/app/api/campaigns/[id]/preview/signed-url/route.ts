import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/[id]/preview/signed-url
 * 
 * Generates short-lived signed URLs for preview video playback.
 * Access strictly restricted to campaign participants (business and creator).
 * Previews expire 24 hours after upload.
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await props.params;

    // 1. Authenticate user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 2. Fetch order and check authorization
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, business_id, business_user_id, creator_id, creator_user_id, current_preview_id, order_status, revisions_used, agreed_revision_limit, included_revisions')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAuthorized =
      order.business_id === user.id ||
      order.business_user_id === user.id ||
      order.creator_id === user.id ||
      order.creator_user_id === user.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Fetch latest or current preview
    let query = (supabase as any)
      .from('campaign_previews')
      .select('*')
      .eq('order_id', orderId);

    if (order.current_preview_id) {
      query = query.eq('id', order.current_preview_id);
    } else {
      query = query.order('preview_version', { ascending: false }).limit(1);
    }

    const { data: preview, error: previewError } = await query.maybeSingle();

    if (previewError || !preview) {
      return NextResponse.json({ preview: null, has_preview: false });
    }

    // Check expiry
    const now = Date.now();
    const expiresAtMs = new Date(preview.expires_at).getTime();
    const isExpired = now >= expiresAtMs || preview.preview_status === 'EXPIRED';
    const secondsRemaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    // If file was deleted or marked expired, do not generate signed URL
    if (preview.deleted_at || preview.preview_status === 'DELETED') {
      return NextResponse.json({
        preview: {
          ...preview,
          is_expired: true,
          signed_url: null,
          seconds_remaining: 0,
        },
        has_preview: true,
      });
    }

    // 4. Generate short-lived signed URL (30 minutes)
    const { data: signedData, error: signError } = await supabase.storage
      .from('campaign-previews')
      .createSignedUrl(preview.storage_path, 1800);

    if (signError || !signedData) {
      console.warn('Could not generate signed URL for preview:', signError);
    }

    return NextResponse.json({
      preview: {
        ...preview,
        signed_url: signedData?.signedUrl || null,
        is_expired: isExpired,
        seconds_remaining: secondsRemaining,
      },
      has_preview: true,
      revisions_used: order.revisions_used || 0,
      agreed_revision_limit: order.agreed_revision_limit || order.included_revisions || 1,
    });
  } catch (err: any) {
    console.error('Error generating preview signed URL:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
