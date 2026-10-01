import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * auto_approve_deadline <= NOW() and approves them.
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

    return NextResponse.json({
      success: true,
      auto_approved_orders: count ?? 0,
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
