import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/complete
 * 
 * Business confirms that agreed campaign requirements and deliverables have been fulfilled.
 * - Transitions order status to COMPLETED.
 * - Records completed_at timestamp.
 * - Sets creator payout_status = PAYOUT_PENDING (Cashfree Easy Split vendor payout remains separate).
 * - Notifies creator.
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
        { error: 'Forbidden. Only the campaign business can confirm completion.' },
        { status: 403 }
      );
    }

    const allowedStatuses = ['DELIVERED', 'READY_TO_PUBLISH', 'APPROVED'];
    if (!allowedStatuses.includes(order.order_status)) {
      return NextResponse.json(
        {
          error: `Cannot complete order in '${order.order_status}' status. Deliverables must be submitted first.`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 3. Update order to COMPLETED
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'COMPLETED',
        payout_status: 'PAYOUT_PENDING',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    // 4. Update final delivery status if present
    if (order.current_final_delivery_id) {
      await (supabase as any)
        .from('campaign_final_deliveries')
        .update({
          delivery_status: 'COMPLETED',
        })
        .eq('id', order.current_final_delivery_id);
    }

    // 5. Preserved Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'CAMPAIGN_COMPLETED',
      from_status: order.order_status,
      to_status: 'COMPLETED',
      reason: 'Business verified deliverable and confirmed campaign completion.',
      metadata: {
        completed_at: now,
        order_number: order.order_number,
      },
    });

    // 6. In-app notification to Creator
    const creatorUserId = order.creator_user_id || order.creator_id;
    await (supabase as any).from('notifications').insert({
      user_id: creatorUserId,
      related_order_id: orderId,
      type: 'ORDER_APPROVED',
      title: 'Campaign Completed! 🎉',
      body: `Business has confirmed completion for Order #${order.order_number}. Both instalments paid. Creator settlement is pending via Cashfree Easy Split.`,
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
        sender_role: 'system',
        body: '🎉 Campaign completed! Business confirmed all deliverables and requirements. Settlement will be processed according to agreed terms.',
        message: '🎉 Campaign completed! Business confirmed all deliverables and requirements. Settlement will be processed according to agreed terms.',
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      order_status: 'COMPLETED',
      payout_status: 'PAYOUT_PENDING',
      message: 'Campaign marked completed successfully.',
    });
  } catch (err: any) {
    console.error('Error completing campaign:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while completing campaign' },
      { status: 500 }
    );
  }
}
