import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/preview/approve
 * 
 * Business approves the watermarked preview.
 * - Transitions status to AWAITING_FINAL_PAYMENT.
 * - Records approved_at timestamp.
 * - Enables final 50% payment action for the business.
 * - Does not unlock final deliverables until final payment is verified.
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

    const supabase = await createClient();

    // 2. Fetch order and check caller is business
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
        { error: 'Forbidden. Only the campaign business partner can approve previews.' },
        { status: 403 }
      );
    }

    if (order.order_status !== 'PREVIEW_SUBMITTED') {
      return NextResponse.json(
        {
          error: `Cannot approve preview when order is in '${order.order_status}' status. Preview must be submitted first.`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 3. Update preview status
    if (order.current_preview_id) {
      await (supabase as any)
        .from('campaign_previews')
        .update({
          preview_status: 'APPROVED',
          updated_at: now,
        })
        .eq('id', order.current_preview_id);
    }

    // 4. Update order status to AWAITING_FINAL_PAYMENT
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'AWAITING_FINAL_PAYMENT',
        approved_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    // 5. Preserved Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'PREVIEW_APPROVED',
      from_status: 'PREVIEW_SUBMITTED',
      to_status: 'AWAITING_FINAL_PAYMENT',
      reason: 'Business approved the watermarked campaign preview. Ready for remaining 50% payment.',
      metadata: {
        preview_id: order.current_preview_id,
        approved_at: now,
      },
    });

    // 6. In-app notification to Creator
    const creatorUserId = order.creator_user_id || order.creator_id;
    await (supabase as any).from('notifications').insert({
      user_id: creatorUserId,
      related_order_id: orderId,
      type: 'ORDER_APPROVED',
      title: 'Campaign Preview Approved!',
      body: 'Your campaign preview has been approved by the brand. The business is now prompted to complete the remaining 50% payment before you release final deliverables.',
    });

    // 7. Conversation system message
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
        body: '✓ Preview approved! Order is now awaiting remaining 50% payment to unlock final deliverables.',
        message: '✓ Preview approved! Order is now awaiting remaining 50% payment to unlock final deliverables.',
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      order_status: 'AWAITING_FINAL_PAYMENT',
      remaining_amount: order.second_payment_amount || Math.round(Number(order.total_amount) * 0.5 * 100) / 100,
      message: 'Preview approved. Please complete remaining 50% payment to unlock final deliverables.',
    });
  } catch (err: any) {
    console.error('Error approving preview:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while approving preview' },
      { status: 500 }
    );
  }
}
