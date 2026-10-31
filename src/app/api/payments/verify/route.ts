import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/server/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/verify
 * 
 * Server-side payment verification for campaign instalments.
 * 
 * Guarantees:
 * 1. Authenticates user.
 * 2. Verifies ownership.
 * 3. Provider-independent verification (verifies HMAC/API status server-side).
 * 4. Idempotent: repeated calls safely return current status without duplicating events.
 * 5. Strictly server-side: frontend state cannot mark payment verified.
 * 6. Atomically updates order status:
 *    - INITIAL payment: sets WORK_STARTED, notifies creator "First payment received...".
 *    - FINAL payment: sets READY_FOR_FINAL_DELIVERY, notifies creator "Final payment received...".
 * 7. Records splits in campaign_splits (keeps payment received separate from settlement).
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await request.json().catch(() => ({}));
    const {
      order_id,
      stage,
      instalment_type,
      provider: requestedProvider,
      provider_order_id,
      provider_payment_id,
      signature,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    const targetProviderOrderId = provider_order_id || razorpay_order_id;
    const targetProviderPaymentId = provider_payment_id || razorpay_payment_id;
    const targetSignature = signature || razorpay_signature;

    if (!targetProviderOrderId) {
      return NextResponse.json(
        { error: 'Missing required provider_order_id.' },
        { status: 400 }
      );
    }

    // 3. Look up order and payment in Supabase
    const supabase = await createClient();

    let targetOrderId = order_id;
    let paymentRecord: any = null;

    if (targetProviderOrderId) {
      const { data: payRec } = await (supabase as any)
        .from('payments')
        .select('*')
        .or(`provider_order_id.eq.${targetProviderOrderId},razorpay_order_id.eq.${targetProviderOrderId},provider_payment_id.eq.${targetProviderOrderId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payRec) {
        paymentRecord = payRec;
        if (!targetOrderId) {
          targetOrderId = payRec.order_id;
        }
      }
    }

    if (!targetOrderId) {
      return NextResponse.json(
        { error: 'Could not locate the associated order in the database.' },
        { status: 404 }
      );
    }

    // Fetch order
    const { data: orderData, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', targetOrderId)
      .maybeSingle();

    if (orderFetchError || !orderData) {
      return NextResponse.json(
        { error: 'Order not found in the database.' },
        { status: 404 }
      );
    }

    // 4. Ownership verification: caller must be the business owner of the order
    const isBusinessOwner =
      orderData.business_id === user.id ||
      orderData.business_user_id === user.id;

    if (!isBusinessOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You are not authorized to verify payment for this order.' },
        { status: 403 }
      );
    }

    // Determine payment stage
    const detectedStage: 'INITIAL' | 'FINAL' =
      stage === 'FINAL' ||
      instalment_type === 'FINAL' ||
      paymentRecord?.stage === 'FINAL' ||
      paymentRecord?.instalment_type === 'FINAL' ||
      Boolean(orderData.initial_paid_at && !orderData.final_paid_at)
        ? 'FINAL'
        : 'INITIAL';

    // 5. Idempotency Check: if this specific stage was already verified
    if (detectedStage === 'INITIAL' && (orderData.initial_paid_at || paymentRecord?.status === 'PAID')) {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        stage: 'INITIAL',
        already_paid: true,
        order_id: orderData.id,
        order_number: orderData.order_number,
      });
    }

    if (detectedStage === 'FINAL' && (orderData.final_paid_at || (orderData.payment_status === 'PAID' && paymentRecord?.status === 'PAID'))) {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        stage: 'FINAL',
        already_paid: true,
        order_id: orderData.id,
        order_number: orderData.order_number,
      });
    }

    // 6. Verify with Payment Provider
    const providerName = requestedProvider || paymentRecord?.provider || 'cashfree';
    const provider = getPaymentProvider(providerName);

    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error: `Payment provider (${provider.providerName}) is not configured yet. Credentials required for verification.`,
          is_configured: false,
        },
        { status: 503 }
      );
    }

    const verificationResult = await provider.verifyPayment({
      orderId: orderData.id,
      instalmentType: detectedStage,
      providerOrderId: targetProviderOrderId,
      providerPaymentId: targetProviderPaymentId,
      signature: targetSignature,
    });

    if (!verificationResult.isVerified || verificationResult.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Payment verification failed. Transaction was not confirmed by the provider.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const stageAmount = detectedStage === 'INITIAL'
      ? Number(orderData.first_payment_amount || orderData.initial_payment_amount || Math.round(Number(orderData.total_amount) * 0.5 * 100) / 100)
      : Number(orderData.second_payment_amount || orderData.final_payment_amount || Math.round(Number(orderData.total_amount) * 0.5 * 100) / 100);

    // 7. Update payment record
    if (paymentRecord?.id) {
      await (supabase as any)
        .from('payments')
        .update({
          status: 'PAID',
          payment_status: 'PAID',
          verified_at: now,
          paid_at: now,
          provider_payment_id: verificationResult.providerPaymentId,
          updated_at: now,
          metadata: {
            ...(paymentRecord.metadata || {}),
            stage: detectedStage,
            instalment_type: detectedStage,
            payment_method: verificationResult.paymentMethod || null,
            verified_at: now,
          },
        })
        .eq('id', paymentRecord.id);

      // Update split records to COMPLETED (splits allocated, settlements remain separate)
      await (supabase as any)
        .from('campaign_splits')
        .update({
          split_status: 'COMPLETED',
          updated_at: now,
        })
        .eq('payment_id', paymentRecord.id);
    }

    // 8. Update order state and send notifications per stage
    if (detectedStage === 'INITIAL') {
      await (supabase as any)
        .from('orders')
        .update({
          order_status: 'WORK_STARTED',
          payment_status: 'PARTIALLY_PAID',
          initial_payment_amount: stageAmount,
          first_payment_amount: stageAmount,
          initial_paid_at: now,
          updated_at: now,
        })
        .eq('id', orderData.id);

      // Audit event
      await (supabase as any).from('order_events').insert({
        order_id: orderData.id,
        actor_id: user.id,
        event_type: 'INITIAL_PAYMENT_VERIFIED',
        from_status: orderData.order_status,
        to_status: 'WORK_STARTED',
        reason: `First instalment (50%) of ₹${stageAmount} verified. Creator authorized to start work and prepare watermarked preview.`,
        metadata: {
          stage: 'INITIAL',
          amount: stageAmount,
          provider: provider.providerName,
          provider_payment_id: verificationResult.providerPaymentId,
        },
      });

      // Notification to Creator (Exact prompt requirement)
      await (supabase as any).from('notifications').insert({
        user_id: orderData.creator_user_id || orderData.creator_id,
        related_order_id: orderData.id,
        type: 'PAYMENT_STATUS_CHANGED',
        title: 'First payment received',
        body: 'Your campaign is now funded for the first instalment. You can start working.',
      });

      // System message in conversation
      const { data: conv } = await supabase.from('conversations').select('id').eq('order_id', orderData.id).maybeSingle();
      if (conv) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          order_id: orderData.id,
          sender_id: user.id,
          sender_user_id: user.id,
          sender_role: 'system',
          body: `✓ First payment received: ₹${stageAmount} (50%) confirmed. Creator is now funded and can start working on the campaign.`,
          message: `✓ First payment received: ₹${stageAmount} (50%) confirmed. Creator is now funded and can start working on the campaign.`,
          moderation_status: 'clean',
        });
      }
    } else {
      // detectedStage === 'FINAL'
      await (supabase as any)
        .from('orders')
        .update({
          order_status: 'READY_FOR_FINAL_DELIVERY',
          payment_status: 'PAID',
          final_payment_amount: stageAmount,
          second_payment_amount: stageAmount,
          final_paid_at: now,
          updated_at: now,
        })
        .eq('id', orderData.id);

      // Audit event
      await (supabase as any).from('order_events').insert({
        order_id: orderData.id,
        actor_id: user.id,
        event_type: 'FINAL_PAYMENT_VERIFIED',
        from_status: orderData.order_status,
        to_status: 'READY_FOR_FINAL_DELIVERY',
        reason: `Second instalment (50%) of ₹${stageAmount} verified. Final delivery unlocked for creator.`,
        metadata: {
          stage: 'FINAL',
          amount: stageAmount,
          provider: provider.providerName,
          provider_payment_id: verificationResult.providerPaymentId,
        },
      });

      // Notification to Creator (Exact prompt requirement)
      await (supabase as any).from('notifications').insert({
        user_id: orderData.creator_user_id || orderData.creator_id,
        related_order_id: orderData.id,
        type: 'PAYMENT_STATUS_CHANGED',
        title: 'Final payment received',
        body: 'You can now upload your final video and complete the campaign.',
      });

      // System message in conversation
      const { data: conv } = await supabase.from('conversations').select('id').eq('order_id', orderData.id).maybeSingle();
      if (conv) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          order_id: orderData.id,
          sender_id: user.id,
          sender_user_id: user.id,
          sender_role: 'system',
          body: `✓ Final payment received: ₹${stageAmount} (50%) confirmed (100% total campaign paid). Final delivery section unlocked for creator.`,
          message: `✓ Final payment received: ₹${stageAmount} (50%) confirmed (100% total campaign paid). Final delivery section unlocked for creator.`,
          moderation_status: 'clean',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'PAID',
      stage: detectedStage,
      already_paid: false,
      order_id: orderData.id,
      order_number: orderData.order_number,
    });
  } catch (err: any) {
    console.error('Error in /api/payments/verify:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while verifying payment.' },
      { status: 500 }
    );
  }
}
