import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyInstagramWebhookChallenge,
  fetchInstagramProfile,
  InstagramWebhookPayload,
} from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhooks/instagram
 * Meta Webhook Verification Endpoint
 *
 * Meta verifies the webhook callback URL by sending:
 * - hub.mode=subscribe
 * - hub.verify_token=<INSTAGRAM_WEBHOOK_VERIFY_TOKEN>
 * - hub.challenge=<random string>
 *
 * Responds with HTTP 200 and the exact hub.challenge if the verify_token matches.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const verifyToken = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const result = verifyInstagramWebhookChallenge(mode, verifyToken, challenge);

    if (result.isValid && result.challenge) {
      return new Response(result.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('Instagram webhook verification failed: Invalid verify token or mode.');
    return new Response('Forbidden', { status: 403 });
  } catch (err: unknown) {
    console.error('Error during Instagram webhook GET verification:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/webhooks/instagram
 * Meta Webhook Event Handler
 *
 * Receives Instagram webhook notifications:
 * - User/Creator profile or media updates
 * - Story insights & engagement notifications
 * - Mention & comment events
 *
 * Idempotently records events into public.instagram_webhook_events and securely
 * refreshes verified creator metrics server-side without exposing credentials.
 */
export async function POST(request: Request) {
  try {
    let payload: InstagramWebhookPayload | null = null;

    try {
      payload = (await request.json()) as InstagramWebhookPayload;
    } catch {
      console.warn('Instagram webhook received non-JSON payload.');
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!payload || !payload.object) {
      console.warn('Instagram webhook received empty or unrecognized payload.');
      return NextResponse.json({ error: 'Missing object property' }, { status: 400 });
    }

    // Process Instagram / Meta events
    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    const supabase = await createClient();

    for (const entry of entries) {
      const accountId = entry.id ? String(entry.id) : null;
      const eventTime = entry.time || Math.floor(Date.now() / 1000);
      const changes = Array.isArray(entry.changes) ? entry.changes : [{ field: 'event', value: {} }];

      for (const change of changes) {
        const fieldName = change.field || 'general';
        const eventId = `${accountId || 'anon'}_${fieldName}_${eventTime}`;
        const summary = {
          object: payload.object,
          field: fieldName,
          accountId: accountId,
          timestamp: eventTime,
        };

        // 1. Record event idempotently in public.instagram_webhook_events
        try {
          await supabase.rpc('record_instagram_webhook_event', {
            p_event_id: eventId,
            p_object_type: payload.object,
            p_account_id: accountId,
            p_field_name: fieldName,
            p_summary: summary,
            p_status: 'processed',
          });
        } catch (rpcErr) {
          console.warn('Failed to record webhook event via RPC:', rpcErr);
        }

        // 2. If accountId matches a verified creator profile, sync latest data
        if (accountId) {
          try {
            const { data: creatorProfile } = await supabase
              .from('creator_profiles')
              .select('user_id, instagram_access_token')
              .eq('instagram_user_id', accountId)
              .maybeSingle();

            if (creatorProfile?.instagram_access_token) {
              const profileData = await fetchInstagramProfile(creatorProfile.instagram_access_token);
              const now = new Date().toISOString();

              await supabase
                .from('creator_profiles')
                .update({
                  follower_count:
                    profileData.followerCount !== null && profileData.followerCount !== undefined
                      ? profileData.followerCount
                      : undefined,
                  instagram_profile_data: profileData.rawData,
                  instagram_last_synced_at: now,
                  instagram_sync_status: 'active',
                  updated_at: now,
                })
                .eq('user_id', creatorProfile.user_id);
            }
          } catch (syncErr) {
            console.warn(`Failed to re-sync creator profile for account ${accountId}:`, syncErr);
          }
        }
      }
    }

    // Always respond with HTTP 200 to Meta promptly
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('Unhandled error in Instagram webhook POST handler:', err);
    // Return HTTP 200 so Meta does not retry indefinitely on non-critical ingestion errors
    return NextResponse.json({ received: true, note: 'Processed with warnings' }, { status: 200 });
  }
}
