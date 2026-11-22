import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerCashfreeEasySplitSettlement } from '@/lib/server/cashfree';

export const dynamic = 'force-dynamic';

/**
 * Server-side Cron Handler for 4-Day Delivery Auto-Approvals
 *
 * Can be scheduled via:
 * 1. Cloudflare Cron Triggers / OpenNext worker
 * 2. Vercel Cron Jobs (vercel.json)
 * 3. External secure cron service (e.g. cron-job.org)
 * 4. Supabase pg_cron extension calling process_auto_approvals()
 *
 * Automatically verifies any orders in 'DELIVERED' status where
 * auto_approve_deadline <= NOW(), approves them, releases Cashfree Easy Split
 * settlements, and sets payout_status = 'RELEASED'.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional verification if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(request.url);
      const secretParam = url.searchParams.get('secret');
      if (secretParam !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const supabase = await createClient();
    const { data: count, error } = await (supabase as any).rpc('process_auto_approvals');

    if (error) {
      console.error('Server-side auto approval failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Release Cashfree Easy Split settlements for any auto-approved or completed orders awaiting release
    const { data: pendingSettlementOrders } = await (supabase as any)
      .from('orders')
      .select('id, order_number')
      .in('order_status', ['AUTO_APPROVED', 'COMPLETED'])
      .eq('payout_status', 'PAYOUT_PENDING');

    if (pendingSettlementOrders && pendingSettlementOrders.length > 0) {
      const now = new Date().toISOString();
      for (const pOrder of pendingSettlementOrders) {
        const { data: splits } = await (supabase as any)
          .from('campaign_splits')
          .select('*')
          .eq('order_id', pOrder.id);

        if (splits && splits.length > 0) {
          for (const split of splits) {
            if (split.vendor_role === 'creator' && split.settlement_status !== 'SETTLED') {
              try {
                await triggerCashfreeEasySplitSettlement({
                  orderId: pOrder.order_number || pOrder.id,
                  vendorId: split.vendor_id,
                  amountInPaise: split.amount_in_paise,
                  remarks: `Auto-approval settlement release for Order #${pOrder.order_number}`,
                });
              } catch (settleErr) {
                console.warn('Notice triggering Cashfree Easy Split in cron:', settleErr);
              }
            }
          }

          await (supabase as any)
            .from('campaign_splits')
            .update({ settlement_status: 'SETTLED', updated_at: now })
            .eq('order_id', pOrder.id);
        }

        await (supabase as any)
          .from('orders')
          .update({ payout_status: 'RELEASED', updated_at: now })
          .eq('id', pOrder.id);
      }
    }

    return NextResponse.json({
      success: true,
      auto_approved_orders: count ?? 0,
      settlements_released: pendingSettlementOrders?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in auto-approval cron route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
