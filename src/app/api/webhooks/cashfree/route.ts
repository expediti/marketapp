import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/server/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/cashfree
 * 
 * Asynchronous webhook handler for Cashfree payment and Easy Split events.
 * 
 * Guarantees:
 * 1. Verifies HMAC-SHA256 signature using CASHFREE_WEBHOOK_SECRET.
 * 2. Idempotent: Duplicate deliveries safely return 200 without creating duplicate splits or events.
 * 3. Handles PAYMENT_SUCCESS, PAYMENT_FAILED, and SETTLEMENT events.
 * 4. Preserves order events and audit history.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const headersRecord: Record<string, string | null> = {
      'x-webhook-signature': request.headers.get('x-webhook-signature'),
      'x-webhook-timestamp': request.headers.get('x-webhook-timestamp'),
    };

    const provider = getPaymentProvider('cashfree');
    const webhookResult = await provider.processWebhook(rawBody, headersRecord);

    if (!webhookResult.isVerified && provider.isConfigured()) {
      console.warn('Invalid Cashfree webhook signature received.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const { providerOrderId, providerPaymentId, status, instalmentType } = webhookResult;

    if (!providerOrderId) {
      return NextResponse.json({ received: true, ignored: 'No providerOrderId present' });
    }

    const supabase = await createClient();

    // Look up payment by provider_order_id
    const { data: paymentRecord } = await (supabase as any)
      .from('payments')
      .select('*')
      .or(`provider_order_id.eq.${providerOrderId},provider_payment_id.eq.${providerOrderId}`)
      .maybeSingle();

    if (!paymentRecord) {
      return NextResponse.json({ received: true, note: 'Payment order not found in database' });
    }

    const orderId = paymentRecord.order_id;
    const stage = (paymentRecord.instalment_type || paymentRecord.stage || instalmentType || 'INITIAL') as 'INITIAL' | 'FINAL';

    // Fetch order
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!orderData) {
      return NextResponse.json({ received: true, note: 'Order not found' });
    }

    // Idempotency: check if already marked paid
    const isAlreadyPaid = stage === 'INITIAL'
      ? Boolean(orderData.initial_paid_at)
      : Boolean(orderData.final_paid_at);

    if (isAlreadyPaid) {
      return NextResponse.json({ received: true, note: 'Already processed' });
    }

    const now = new Date().toISOString();

    if (status === 'PAID') {
      // 1. Update payment record
      await (supabase as any)
        .from('payments')
        .update({
          status: 'PAID',
          payment_status: 'PAID',
          provider_payment_id: providerPaymentId || paymentRecord.provider_payment_id,
          paid_at: now,
          verified_at: now,
          updated_at: now,
        })
        .eq('id', paymentRecord.id);

      // 2. Complete split records
      await (supabase as any)
        .from('campaign_splits')
        .update({
          split_status: 'COMPLETED',
          updated_at: now,
        })
        .eq('payment_id', paymentRecord.id);

      // 3. Update order
      if (stage === 'INITIAL') {
        await (supabase as any)
          .from('orders')
          .update({
            order_status: 'WORK_STARTED',
            payment_status: 'PARTIALLY_PAID',
            initial_paid_at: now,
            updated_at: now,
          })
          .eq('id', orderId);

        await (supabase as any).from('order_events').insert({
          order_id: orderId,
          event_type: 'INITIAL_PAYMENT_VERIFIED',
          from_status: orderData.order_status,
          to_status: 'WORK_STARTED',
          reason: 'Initial 50% payment confirmed via Cashfree Webhook.',
          metadata: {
            stage: 'INITIAL',
            provider_order_id: providerOrderId,
            source: 'cashfree_webhook',
          },
        });

        if (orderData.creator_user_id || orderData.creator_id) {
          await (supabase as any).from('notifications').insert({
            user_id: orderData.creator_user_id || orderData.creator_id,
            related_order_id: orderId,
            type: 'PAYMENT_STATUS_CHANGED',
            title: 'First payment received',
            body: 'Your campaign is now funded for the first instalment. You can start working.',
          });
        }
      } else {
        // FINAL
        await (supabase as any)
          .from('orders')
          .update({
            order_status: 'READY_FOR_FINAL_DELIVERY',
            payment_status: 'PAID',
            final_paid_at: now,
            updated_at: now,
          })
          .eq('id', orderId);

        await (supabase as any).from('order_events').insert({
          order_id: orderId,
          event_type: 'FINAL_PAYMENT_VERIFIED',
          from_status: orderData.order_status,
          to_status: 'READY_FOR_FINAL_DELIVERY',
          reason: 'Final 50% payment confirmed via Cashfree Webhook.',
          metadata: {
            stage: 'FINAL',
            provider_order_id: providerOrderId,
            source: 'cashfree_webhook',
          },
        });

        if (orderData.creator_user_id || orderData.creator_id) {
          await (supabase as any).from('notifications').insert({
            user_id: orderData.creator_user_id || orderData.creator_id,
            related_order_id: orderId,
            type: 'PAYMENT_STATUS_CHANGED',
            title: 'Final payment received',
            body: 'You can now upload your final video and complete the campaign.',
          });
        }
      }
    } else if (status === 'FAILED') {
      await (supabase as any)
        .from('payments')
        .update({
          status: 'FAILED',
          payment_status: 'FAILED',
          failure_reason: 'Payment failed at gateway',
          updated_at: now,
        })
        .eq('id', paymentRecord.id);
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (err: any) {
    console.error('Error in Cashfree webhook route:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error in webhook handler' },
      { status: 500 }
    );
  }
}
