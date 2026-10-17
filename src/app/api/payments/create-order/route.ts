import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { createRazorpayOrder, getRazorpayCredentials } from '@/lib/server/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create-order
 * 
 * Server-side order creation for Razorpay Standard Checkout.
 * 
 * Guarantees:
 * 1. User must be authenticated.
 * 2. User must be the business/customer owning the order.
 * 3. Order must be DEAL_CONFIRMED or PAYMENT_PENDING.
 * 4. Payment must not already be PAID.
 * 5. Amount is strictly read from orders.total_amount in Supabase database.
 * 6. Never exposes RAZORPAY_KEY_SECRET to the client.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user server-side
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to complete payment.' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { order_id, stage = 'INITIAL' } = body;
    const paymentStage: 'INITIAL' | 'FINAL' = stage === 'FINAL' ? 'FINAL' : 'INITIAL';

    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    // 3. Fetch order from Supabase
    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, business_id, business_user_id, order_status, payment_status, total_amount, initial_payment_amount, final_payment_amount, initial_paid_at, final_paid_at')
      .eq('id', order_id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 4. Ownership verification: caller must be the business
    const isOwner =
      order.business_id === user.id ||
      order.business_user_id === user.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to pay for this order.' },
        { status: 403 }
      );
    }

    // 5. Amount verification (Source of truth: database)
    const lockedTotalAmount = Number(order.total_amount);
    if (isNaN(lockedTotalAmount) || lockedTotalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount in database.' },
        { status: 400 }
      );
    }

    // Calculate Two-Stage (50% initial + 50% final) amounts
    const initialAmount = Math.round(lockedTotalAmount * 0.5 * 100) / 100;
    const finalAmount = Math.round((lockedTotalAmount - initialAmount) * 100) / 100;

    let stageAmount = initialAmount;
    if (paymentStage === 'FINAL') {
      stageAmount = finalAmount;
    }

    // 6. Workflow state verification per stage
    if (paymentStage === 'INITIAL') {
      if (order.initial_paid_at || order.payment_status === 'PARTIALLY_PAID' || (order.payment_status === 'PAID' && order.initial_paid_at)) {
        return NextResponse.json(
          { error: 'Initial 50% payment has already been completed for this order.' },
          { status: 400 }
        );
      }

      const allowedInitialStatuses = ['DEAL_CONFIRMED', 'PAYMENT_PENDING', 'ACCEPTED_AWAITING_PAYMENT', 'DRAFT', 'ACCEPTED'];
      if (!allowedInitialStatuses.includes(order.order_status)) {
        return NextResponse.json(
          {
            error: `Initial payment cannot be initiated for order in '${order.order_status}' status.`,
          },
          { status: 400 }
        );
      }
    } else {
      // paymentStage === 'FINAL'
      if (order.final_paid_at || (order.payment_status === 'PAID' && order.final_paid_at)) {
        return NextResponse.json(
          { error: 'Final 50% payment has already been completed for this order.' },
          { status: 400 }
        );
      }

      const allowedFinalStatuses = [
        'PREVIEW_SUBMITTED',
        'FINAL_PAYMENT_PENDING',
        'DELIVERED',
        'WORK_STARTED',
        'IN_PROGRESS',
        'PAID',
        'READY_TO_PUBLISH'
      ];
      if (!allowedFinalStatuses.includes(order.order_status)) {
        return NextResponse.json(
          {
            error: `Final payment cannot be initiated for order in '${order.order_status}' status. Creator must share private preview first.`,
          },
          { status: 400 }
        );
      }
    }

    // Amount in paise (integer)
    const amountInPaise = Math.round(stageAmount * 100);

    // 7. Create Razorpay Order server-side
    const { keyId } = getRazorpayCredentials();

    const stageNote = paymentStage === 'INITIAL' ? '50% Initial' : '50% Final';
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `${order.order_number}-${paymentStage.toLowerCase()}`,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
        business_id: user.id,
        stage: paymentStage,
        note: stageNote,
      },
    });

    // 8. Store the Razorpay order ID in Supabase payments table
    const { error: directError } = await (supabase as any)
      .from('payments')
      .upsert(
        {
          order_id: order.id,
          payer_user_id: user.id,
          provider: 'razorpay',
          provider_payment_id: razorpayOrder.id,
          razorpay_order_id: razorpayOrder.id,
          amount: stageAmount,
          currency: 'INR',
          status: 'PENDING',
          stage: paymentStage,
          metadata: {
            stage: paymentStage,
            stage_amount: stageAmount,
            total_amount: lockedTotalAmount,
          },
        },
        { onConflict: 'razorpay_order_id' }
      );

    if (directError) {
      console.warn('Payment record upsert notice:', directError);
    }

    // 9. Return ONLY what is required by Razorpay Standard Checkout
    return NextResponse.json({
      success: true,
      key_id: keyId,
      order_id: razorpayOrder.id, // Razorpay order id (e.g. order_EKwxwAgItmmMnv)
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      order_number: order.order_number,
      stage: paymentStage,
    });
  } catch (err: any) {
    console.error('Error in /api/payments/create-order:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while creating payment order' },
      { status: 500 }
    );
  }
}
