import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/expire-previews
 * 
 * Scheduled backend job to clean up expired preview videos after their 24-hour retention window.
 * 
 * Rules:
 * 1. Finds preview records where expires_at <= NOW() and preview_status = 'ACTIVE' and deleted_at IS NULL.
 * 2. Preservation Rule: If associated order is in 'DISPUTED', 'SYSTEM_REVIEW', or 'ADMIN_REVIEW',
 *    the preview is marked 'DISPUTED_PRESERVED' and the video object is preserved as evidence.
 * 3. Deletes expired video object from private Supabase Storage bucket 'campaign-previews'.
 * 4. Marks preview record preview_status = 'EXPIRED', deleted_at = NOW().
 * 5. Logs audit event in order_events for compliance.
 * 6. Preserves replacement previews: each preview has a unique ID and storage path.
 */
export async function POST(request: Request) {
  try {
    // Optional bearer secret check if invoked via CRON_SECRET header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production if secret is set, protect the cron endpoint
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Fetch expired active previews
    const { data: expiredPreviews, error: queryError } = await (supabase as any)
      .from('campaign_previews')
      .select('id, order_id, storage_path, file_name, preview_version, expires_at, preview_status')
      .eq('preview_status', 'ACTIVE')
      .lte('expires_at', nowIso)
      .is('deleted_at', null)
      .limit(50);

    if (queryError) {
      console.error('Error querying expired previews:', queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!expiredPreviews || expiredPreviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired previews to process.',
        processed_count: 0,
      });
    }

    const results: Array<{
      preview_id: string;
      order_id: string;
      status: 'EXPIRED_DELETED' | 'DISPUTED_PRESERVED' | 'FAILED';
      error?: string;
    }> = [];

    for (const preview of expiredPreviews) {
      try {
        // Check order status for active disputes
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_status, order_number')
          .eq('id', preview.order_id)
          .maybeSingle();

        const isDisputed =
          order?.order_status === 'DISPUTED' ||
          order?.order_status === 'SYSTEM_REVIEW' ||
          order?.order_status === 'ADMIN_REVIEW';

        if (isDisputed) {
          // Preservation rule: Preserve evidence
          await (supabase as any)
            .from('campaign_previews')
            .update({
              preview_status: 'DISPUTED_PRESERVED',
              updated_at: nowIso,
            })
            .eq('id', preview.id);

          await (supabase as any).from('order_events').insert({
            order_id: preview.order_id,
            event_type: 'PREVIEW_EVIDENCE_PRESERVED',
            from_status: order?.order_status || 'DISPUTED',
            to_status: order?.order_status || 'DISPUTED',
            reason: `24-hour expiry reached for preview v${preview.preview_version}, but file preserved as required evidence for active dispute/review.`,
            metadata: {
              preview_id: preview.id,
              storage_path: preview.storage_path,
              order_status: order?.order_status,
            },
          });

          results.push({
            preview_id: preview.id,
            order_id: preview.order_id,
            status: 'DISPUTED_PRESERVED',
          });
          continue;
        }

        // Delete from storage
        const { error: storageDeleteError } = await supabase.storage
          .from('campaign-previews')
          .remove([preview.storage_path]);

        if (storageDeleteError) {
          console.warn(`Storage deletion warning for preview ${preview.id}:`, storageDeleteError);
        }

        // Update preview record to EXPIRED
        await (supabase as any)
          .from('campaign_previews')
          .update({
            preview_status: 'EXPIRED',
            deleted_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', preview.id);

        // Audit log in order_events
        await (supabase as any).from('order_events').insert({
          order_id: preview.order_id,
          event_type: 'PREVIEW_EXPIRED_CLEANED',
          from_status: order?.order_status || 'PREVIEW_SUBMITTED',
          to_status: order?.order_status || 'PREVIEW_SUBMITTED',
          reason: `Preview v${preview.preview_version} exceeded 24-hour review window. Storage object deleted, audit metadata preserved.`,
          metadata: {
            preview_id: preview.id,
            preview_version: preview.preview_version,
            storage_path: preview.storage_path,
            expired_at: preview.expires_at,
            deleted_at: nowIso,
          },
        });

        results.push({
          preview_id: preview.id,
          order_id: preview.order_id,
          status: 'EXPIRED_DELETED',
        });
      } catch (itemErr: any) {
        console.error(`Error processing expired preview ${preview.id}:`, itemErr);
        results.push({
          preview_id: preview.id,
          order_id: preview.order_id,
          status: 'FAILED',
          error: itemErr.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: results.length,
      results,
    });
  } catch (err: any) {
    console.error('Error in /api/cron/expire-previews:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while expiring previews' },
      { status: 500 }
    );
  }
}

// Support GET for testing or simple health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/expire-previews',
    description: 'Scheduled execution job for 24-hour campaign preview expiry',
    method: 'POST',
  });
}
