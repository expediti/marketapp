import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRazorpayWebhookSignature } from '@/lib/server/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/razorpay/webhook
 * 
 * Secure webhook handler for Razorpay asynchronous payment events.
 * 
 * Guarantees:
 * 1. Verifies Razorpay webhook signature with RAZORPAY_WEBHOOK_SECRET.
 * 2. Idempotent: Duplicate webhook deliveries do not duplicate state, events, or notifications.
 * 3. Handles 'payment.captured', 'order.paid', and 'payment.failed'.
 * 4. Preserves order event audit history.
 */
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured on the server.');
      return NextResponse.json(
        { error: 'Webhook secret is not configured on server' },
        { status: 500 }
      );
    }

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // Read the raw body as text for HMAC-SHA256 signature verification
    const rawBody = await request.text();

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      webhookSecret,
    });

    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature received.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Parse verified payload
    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = eventPayload?.event;
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    const orderEntity = eventPayload?.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      // Event without order reference, acknowledge receipt
      return NextResponse.json({ received: true, ignored: 'No order_id present' });
    }

    const supabase = await createClient();

    // Handle Payment Success: 'payment.captured' or 'order.paid'
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentMethod = paymentEntity?.method;

      // Call verify_and_confirm_payment RPC (idempotent)
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        'verify_and_confirm_payment',
        {
          p_razorpay_order_id: razorpayOrderId,
          p_razorpay_payment_id: razorpayPaymentId || razorpayOrderId,
          p_razorpay_signature: null, // Webhook signature already verified above
          p_payment_method: paymentMethod || null,
        }
      );

      if (rpcError) {
        console.warn('Webhook verify_and_confirm_payment RPC warning:', rpcError);

        // Fallback: check if order is already paid
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        if (existingPayment?.order_id) {
          const targetOrderId = existingPayment.order_id;
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('id', targetOrderId)
            .maybeSingle();

          if (orderData?.payment_status === 'PAID') {
            return NextResponse.json({ success: true, already_paid: true });
          }

          const now = new Date().toISOString();

          await (supabase as any)
            .from('payments')
            .update({
              status: 'PAID',
              razorpay_payment_id: razorpayPaymentId,
              paid_at: now,
              updated_at: now,
            })
            .eq('id', existingPayment.id);

          await (supabase as any)
            .from('orders')
            .update({
              order_status: 'PAID',
              payment_status: 'PAID',
              updated_at: now,
            })
            .eq('id', targetOrderId);

          await (supabase as any).from('order_events').insert({
            order_id: targetOrderId,
            event_type: 'PAYMENT_VERIFIED',
            from_status: orderData?.order_status || 'PENDING',
            to_status: 'PAID',
            reason: 'Payment confirmed via Razorpay Webhook.',
            metadata: {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              source: 'webhook',
            },
          });

          if (orderData?.creator_user_id) {
            await (supabase as any).from('notifications').insert({
              user_id: orderData.creator_user_id,
              related_order_id: targetOrderId,
              type: 'PAYMENT_STATUS_CHANGED',
              title: 'Payment Received!',
              body: `Payment confirmed for Order #${orderData.order_number}. You can now start the work.`,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        event: eventType,
        result: rpcData || 'processed',
      });
    }

    // Handle Payment Failure: 'payment.failed'
    if (eventType === 'payment.failed') {
      const errorCode = paymentEntity?.error_code;
      const errorDescription = paymentEntity?.error_description || 'Payment failed';

      await (supabase as any).rpc('record_payment_failure', {
        p_razorpay_order_id: razorpayOrderId,
        p_reason: errorDescription,
        p_error_code: errorCode || null,
        p_error_description: errorDescription,
      });

      return NextResponse.json({
        success: true,
        event: eventType,
        status: 'FAILED',
      });
    }

    // Other events acknowledged
    return NextResponse.json({ received: true, event: eventType });
  } catch (err: any) {
    console.error('Error in Razorpay Webhook:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error in webhook handler' },
      { status: 500 }
    );
  }
}
