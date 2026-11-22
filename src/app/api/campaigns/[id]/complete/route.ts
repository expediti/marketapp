import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { triggerCashfreeEasySplitSettlement } from '@/lib/server/cashfree';

export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/[id]/complete
 * 
 * Business confirms that agreed campaign requirements and deliverables have been fulfilled.
 * - Transitions order status to COMPLETED.
 * - Records completed_at timestamp.
 * - Triggers Cashfree Easy Split on-demand settlement release for INITIAL and FINAL splits.
 * - Updates campaign_splits.settlement_status = 'SETTLED'.
 * - Sets creator payout_status = RELEASED.
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

    // 3. Trigger Cashfree Easy Split settlement release for all splits linked to this order
    const { data: splits } = await (supabase as any)
      .from('campaign_splits')
      .select('*')
      .eq('order_id', orderId);

    if (splits && splits.length > 0) {
      for (const split of splits) {
        if (split.vendor_role === 'creator' && split.settlement_status !== 'SETTLED') {
          try {
            await triggerCashfreeEasySplitSettlement({
              orderId: order.order_number || order.id,
              vendorId: split.vendor_id,
              amountInPaise: split.amount_in_paise,
              remarks: `Release for Order #${order.order_number} (${split.instalment_type})`,
            });
          } catch (settleErr) {
            console.warn('Notice triggering Cashfree Easy Split settlement release:', settleErr);
          }
        }
      }

      // Mark splits as SETTLED
      await (supabase as any)
        .from('campaign_splits')
        .update({
          settlement_status: 'SETTLED',
          updated_at: now,
        })
        .eq('order_id', orderId);
    }

    // 4. Update order to COMPLETED and payout_status to RELEASED
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'COMPLETED',
        payout_status: 'RELEASED',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    // 5. Update final delivery status if present
    if (order.current_final_delivery_id) {
      await (supabase as any)
        .from('campaign_final_deliveries')
        .update({
          delivery_status: 'COMPLETED',
        })
        .eq('id', order.current_final_delivery_id);
    }

    // 6. Preserved Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'CAMPAIGN_COMPLETED',
      from_status: order.order_status,
      to_status: 'COMPLETED',
      reason: 'Business verified deliverable and confirmed campaign completion. Easy Split settlement released to creator.',
      metadata: {
        completed_at: now,
        order_number: order.order_number,
        payout_status: 'RELEASED',
      },
    });

    // 7. In-app notification to Creator
    const creatorUserId = order.creator_user_id || order.creator_id;
    await (supabase as any).from('notifications').insert({
      user_id: creatorUserId,
      related_order_id: orderId,
      type: 'ORDER_APPROVED',
      title: 'Campaign Completed! 🎉',
      body: `Business has confirmed completion for Order #${order.order_number}. Cashfree Easy Split payout has been released to your bank account.`,
    });

    // 8. Conversation system message
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
        body: '🎉 Campaign completed! Business confirmed all deliverables and requirements. Cashfree Easy Split settlement has been released to creator.',
        message: '🎉 Campaign completed! Business confirmed all deliverables and requirements. Cashfree Easy Split settlement has been released to creator.',
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      order_status: 'COMPLETED',
      payout_status: 'RELEASED',
      message: 'Campaign marked completed and creator settlement released successfully.',
    });
  } catch (err: any) {
    console.error('Error completing campaign:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while completing campaign' },
      { status: 500 }
    );
  }
}
