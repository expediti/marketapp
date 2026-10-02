import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/fail
 * 
 * Server-side recording of failed or cancelled payment attempts.
 * 
 * Rules:
 * - Order remains in payment-required state (DEAL_CONFIRMED).
 * - Business can retry.
 * - Does not mark order as PAID.
 * - Does not notify creator of success.
 * - Records failure reason in audit log and payment record.
 */
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { order_id, razorpay_order_id, error_code, error_description, reason } = body;

    const failureReason = error_description || reason || 'Payment cancelled or failed';

    const supabase = await createClient();

    // Call record_payment_failure RPC if razorpay_order_id is available
    if (razorpay_order_id) {
      const { data, error: rpcError } = await (supabase as any).rpc('record_payment_failure', {
        p_razorpay_order_id: razorpay_order_id,
        p_reason: failureReason,
        p_error_code: error_code || null,
        p_error_description: error_description || null,
      });

      if (!rpcError && data) {
        return NextResponse.json({ success: true, status: 'FAILED' });
      }
    }

    // Direct fallback if order_id is provided
    if (order_id) {
      const now = new Date().toISOString();
      await (supabase as any)
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: failureReason,
          updated_at: now,
        })
        .eq('order_id', order_id)
        .neq('status', 'PAID');

      await (supabase as any)
        .from('orders')
        .update({
          payment_status: 'FAILED',
          updated_at: now,
        })
        .eq('id', order_id)
        .neq('payment_status', 'PAID');

      await (supabase as any).from('order_events').insert({
        order_id,
        actor_id: user.id,
        event_type: 'PAYMENT_FAILED',
        from_status: 'PENDING',
        to_status: 'FAILED',
        reason: failureReason,
        metadata: {
          error_code,
          error_description,
          razorpay_order_id,
        },
      });
    }

    return NextResponse.json({ success: true, status: 'FAILED' });
  } catch (err: any) {
    console.error('Error in /api/payments/fail:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while logging payment failure.' },
      { status: 500 }
    );
  }
}
