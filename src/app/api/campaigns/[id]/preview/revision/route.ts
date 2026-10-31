import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/preview/revision
 * 
 * Business requests a revision on the submitted preview.
 * 
 * Enforces:
 * 1. Caller must be business owner.
 * 2. Order status must be PREVIEW_SUBMITTED.
 * 3. Enforces agreed revision limit.
 * 4. Requires written feedback.
 * 5. Changes status to REVISION_REQUESTED and notifies creator.
 */
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { feedback } = body;

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'A written explanation/feedback is required to request a revision.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isBusiness =
      order.business_id === user.id ||
      order.business_user_id === user.id;

    if (!isBusiness) {
      return NextResponse.json(
        { error: 'Forbidden. Only the campaign business can request revisions.' },
        { status: 403 }
      );
    }

    if (order.order_status !== 'PREVIEW_SUBMITTED') {
      return NextResponse.json(
        {
          error: `Cannot request revision when order is in '${order.order_status}' status. Preview must be under review.`,
        },
        { status: 400 }
      );
    }

    // 3. Enforce revision limits
    const allowedLimit = order.agreed_revision_limit ?? order.included_revisions ?? 1;
    const currentUsed = order.revisions_used ?? 0;

    if (currentUsed >= allowedLimit) {
      return NextResponse.json(
        {
          error: `Revision limit reached. This campaign includes ${allowedLimit} revision(s), all of which have been used. To proceed, please approve the preview or open a mutual agreement.`,
          revisions_used: currentUsed,
          agreed_revision_limit: allowedLimit,
        },
        { status: 400 }
      );
    }

    const nextRevisionNumber = currentUsed + 1;
    const now = new Date().toISOString();
    const creatorUserId = order.creator_user_id || order.creator_id;

    // 4. Record revision in public.campaign_revisions
    const { error: revInsertError } = await (supabase as any)
      .from('campaign_revisions')
      .insert({
        order_id: orderId,
        preview_id: order.current_preview_id,
        requested_by: user.id,
        creator_id: creatorUserId,
        feedback: feedback.trim(),
        revision_number: nextRevisionNumber,
        status: 'PENDING',
        created_at: now,
      });

    if (revInsertError) {
      console.warn('Notice inserting campaign_revisions:', revInsertError);
    }

    // 5. Update preview status
    if (order.current_preview_id) {
      await (supabase as any)
        .from('campaign_previews')
        .update({
          preview_status: 'REVISION_REQUESTED',
          updated_at: now,
        })
        .eq('id', order.current_preview_id);
    }

    // 6. Update order state & revision counter
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'REVISION_REQUESTED',
        revisions_used: nextRevisionNumber,
        updated_at: now,
      })
      .eq('id', orderId);

    // 7. Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'REVISION_REQUESTED',
      from_status: 'PREVIEW_SUBMITTED',
      to_status: 'REVISION_REQUESTED',
      reason: `Revision #${nextRevisionNumber} requested by business: ${feedback.trim().slice(0, 100)}...`,
      metadata: {
        revision_number: nextRevisionNumber,
        revisions_used: nextRevisionNumber,
        revisions_limit: allowedLimit,
        feedback: feedback.trim(),
      },
    });

    // 8. In-app notification to Creator
    await (supabase as any).from('notifications').insert({
      user_id: creatorUserId,
      related_order_id: orderId,
      type: 'REVISION_REQUESTED',
      title: `Revision Requested (${nextRevisionNumber}/${allowedLimit})`,
      body: `Brand requested a revision for Order #${order.order_number}: "${feedback.trim().slice(0, 100)}". You can upload a replacement preview.`,
    });

    // 9. Conversation message
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        order_id: orderId,
        sender_id: user.id,
        sender_user_id: user.id,
        sender_role: 'business',
        body: `🔄 Revision #${nextRevisionNumber} requested:\n"${feedback.trim()}"\n(${allowedLimit - nextRevisionNumber} revision(s) remaining). Please submit a revised preview.`,
        message: `🔄 Revision #${nextRevisionNumber} requested:\n"${feedback.trim()}"\n(${allowedLimit - nextRevisionNumber} revision(s) remaining). Please submit a revised preview.`,
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      order_status: 'REVISION_REQUESTED',
      revisions_used: nextRevisionNumber,
      revisions_remaining: allowedLimit - nextRevisionNumber,
      message: 'Revision request recorded. Creator has been notified to upload a replacement preview.',
    });
  } catch (err: any) {
    console.error('Error requesting revision:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while requesting revision' },
      { status: 500 }
    );
  }
}
