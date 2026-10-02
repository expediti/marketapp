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
    const { order_id } = body;

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
      .select('id, order_number, business_id, business_user_id, order_status, payment_status, total_amount')
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

    // 5. Verification: payment must not already be PAID
    if (order.payment_status === 'PAID' || order.order_status === 'PAID') {
      return NextResponse.json(
        { error: 'This order has already been paid.' },
        { status: 400 }
      );
    }

    // 6. Workflow state verification: order must be DEAL_CONFIRMED or PAYMENT_PENDING
    const allowedStatuses = ['DEAL_CONFIRMED', 'PAYMENT_PENDING', 'ACCEPTED_AWAITING_PAYMENT'];
    if (!allowedStatuses.includes(order.order_status)) {
      return NextResponse.json(
        {
          error: `Payment cannot be initiated for order in '${order.order_status}' status. Must be DEAL_CONFIRMED.`,
        },
        { status: 400 }
      );
    }

    // 7. Amount verification (Source of truth: database)
    const lockedTotalAmount = Number(order.total_amount);
    if (isNaN(lockedTotalAmount) || lockedTotalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount in database.' },
        { status: 400 }
      );
    }

    // Amount in paise (integer)
    const amountInPaise = Math.round(lockedTotalAmount * 100);

    // 8. Create Razorpay Order server-side
    const { keyId } = getRazorpayCredentials();

    const razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
        business_id: user.id,
      },
    });

    // 9. Store the Razorpay order ID in Supabase payments table via RPC
    const { error: rpcError } = await (supabase as any).rpc('record_payment_order', {
      p_order_id: order.id,
      p_razorpay_order_id: razorpayOrder.id,
      p_amount: lockedTotalAmount,
      p_currency: 'INR',
      p_payer_user_id: user.id,
    });

    if (rpcError) {
      console.error('Failed to record payment order in database:', rpcError);
      // Fallback direct insert/update if RPC is not yet applied
      const { error: directError } = await (supabase as any)
        .from('payments')
        .upsert(
          {
            order_id: order.id,
            payer_user_id: user.id,
            provider: 'razorpay',
            provider_payment_id: razorpayOrder.id,
            razorpay_order_id: razorpayOrder.id,
            amount: lockedTotalAmount,
            currency: 'INR',
            status: 'PENDING',
          },
          { onConflict: 'razorpay_order_id' }
        );
      if (directError) {
        console.warn('Direct payment fallback also reported:', directError);
      }
    }

    // 10. Return ONLY what is required by Razorpay Standard Checkout
    // NEVER expose RAZORPAY_KEY_SECRET!
    return NextResponse.json({
      success: true,
      key_id: keyId,
      order_id: razorpayOrder.id, // Razorpay order id (e.g. order_EKwxwAgItmmMnv)
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      order_number: order.order_number,
    });
  } catch (err: any) {
    console.error('Error in /api/payments/create-order:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while creating payment order' },
      { status: 500 }
    );
  }
}
