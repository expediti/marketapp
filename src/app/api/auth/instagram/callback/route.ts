import { NextResponse } from 'next/server';
import { createClient, createServiceClient, getAuthenticatedUser } from '@/lib/supabase/server';
import {
  exchangeInstagramCode,
  fetchInstagramProfile,
  fetchInstagramUserMedia,
  getInstagramCredentials,
} from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';

function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `https://${host}`;
  }
  return new URL(request.url).origin;
}

interface StatePayload {
  uid: string;
  ret: string;
  ts: number;
}

function parseState(rawState: string | null): StatePayload | null {
  if (!rawState) return null;
  try {
    const json = Buffer.from(rawState, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.uid === 'string') {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse Instagram OAuth state:', e);
  }
  return null;
}

/**
 * GET /api/auth/instagram/callback
 * Production Callback URL: https://marketapp.expeditionthe0.workers.dev/api/auth/instagram/callback
 *
 * 1. Validates the OAuth response and state token.
 * 2. Exchanges authorization code server-side (keeping INSTAGRAM_APP_SECRET strictly server-side).
 * 3. Fetches verified Instagram account info & metrics.
 * 4. Saves verified account to public.creator_profiles linked to auth.users.id.
 * 5. Redirects back to creator onboarding or dashboard.
 */
export async function GET(request: Request) {
  const origin = getOrigin(request);
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');
  const rawState = searchParams.get('state');

  const parsedState = parseState(rawState);
  const returnTo = parsedState?.ret || '/auth/onboarding/creator';

  // 1. Handle user cancellation or OAuth error
  if (error || errorReason) {
    const message = errorDescription || errorReason || error || 'Instagram authorization was cancelled.';
    console.warn('Instagram OAuth returned error:', { error, errorReason, errorDescription });
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent(message)}`
    );
  }

  // 2. Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('No authorization code was provided by Instagram.')}`
    );
  }

  // 3. Validate state
  if (!parsedState || !parsedState.uid) {
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Invalid or expired Instagram session state.')}`
    );
  }

  // Check state age (must be within 30 minutes)
  const age = Date.now() - (parsedState.ts || 0);
  if (age > 30 * 60 * 1000) {
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Instagram authorization session timed out. Please try again.')}`
    );
  }

  // 4. Verify authenticated user matches state creator UID (or has active session)
  const { user: authUser } = await getAuthenticatedUser();
  const targetUserId = authUser?.id || parsedState.uid;

  if (authUser && authUser.id !== parsedState.uid) {
    console.warn('Authenticated user does not match state user ID:', {
      authId: authUser.id,
      stateId: parsedState.uid,
    });
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Authenticated user mismatch. Please try again.')}`
    );
  }

  try {
    // 5. Server-side code exchange
    // Note: Instagram App Secret is retrieved server-side via Cloudflare runtime context
    const tokenResult = await exchangeInstagramCode(code);
    console.log(`[Instagram OAuth] Code exchange succeeded. User ID: ${tokenResult.userId}`);

    // 6. Fetch verified Instagram profile information and supported metrics
    const profile = await fetchInstagramProfile(tokenResult.accessToken);
    console.log(
      `[Instagram OAuth] Profile fetched: @${profile.username} (ID: ${profile.id}, Followers: ${profile.followerCount ?? 'N/A'})`
    );

    // 7. Associate verified Instagram account with creator profile in Supabase using service client
    const serviceClient = createServiceClient();
    const now = new Date().toISOString();

    // Check existing creator_profile to preserve non-Instagram creator data
    const { data: existingCp } = await serviceClient
      .from('creator_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const followerCountToSave =
      typeof profile.followerCount === 'number' && profile.followerCount > 0
        ? profile.followerCount
        : (existingCp?.follower_count || 0);

    const updatePayload: Record<string, any> = {
      user_id: targetUserId,
      instagram_connected: true,
      instagram_verified: true,
      instagram_user_id: profile.id,
      instagram_username: profile.username,
      follower_count: followerCountToSave,
      metrics_source: 'instagram_meta_verified',
      metrics_verified_at: now,
      verification_status: 'verified_oauth',
      instagram_connected_at: now,
      instagram_profile_data: profile.rawData,
      instagram_access_token: tokenResult.accessToken,
      updated_at: now,
    };

    if (!existingCp) {
      updatePayload.display_name = profile.username || 'Creator';
      updatePayload.bio = profile.biography || 'Content creator helping apps reach targeted users.';
      updatePayload.profile_image_path = profile.profilePictureUrl || null;
      updatePayload.country = 'India';
      updatePayload.city = 'India';
      updatePayload.niche = 'Technology';
      updatePayload.categories = ['Technology'];
      updatePayload.languages = ['Hindi', 'English'];
      updatePayload.average_reach = 0;
      updatePayload.engagement_rate = 0.0;
    } else {
      if (!existingCp.profile_image_path && profile.profilePictureUrl) {
        updatePayload.profile_image_path = profile.profilePictureUrl;
      }
    }

    const { error: upsertError } = await serviceClient
      .from('creator_profiles')
      .upsert(updatePayload, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[Instagram OAuth] Error upserting creator_profiles:', upsertError.message);
      throw new Error(`Failed to save Instagram profile connection: ${upsertError.message}`);
    }

    console.log(`[Instagram OAuth] creator_profiles successfully updated for user: ${targetUserId}`);

    // Also update public.profiles display_name / avatar if needed
    try {
      const { data: userProfile } = await serviceClient
        .from('profiles')
        .select('id, avatar_url, display_name')
        .eq('id', targetUserId)
        .maybeSingle();

      if (userProfile && !userProfile.avatar_url && profile.profilePictureUrl) {
        await serviceClient
          .from('profiles')
          .update({ avatar_url: profile.profilePictureUrl, updated_at: now })
          .eq('id', targetUserId);
      }
    } catch (profileUpdateErr) {
      console.warn('[Instagram OAuth] profiles update note:', profileUpdateErr);
    }

    // 8. Fetch user media/reels and save to creator_reels (non-blocking)
    try {
      const mediaItems = await fetchInstagramUserMedia(tokenResult.accessToken);
      if (mediaItems && mediaItems.length > 0) {
        const reelRows = mediaItems.map((m, idx) => ({
          creator_id: targetUserId,
          title: m.caption ? m.caption.slice(0, 80) : `Instagram Reel #${idx + 1}`,
          video_url: m.mediaUrl || m.permalink || '',
          reel_url: m.permalink || m.mediaUrl || null,
          instagram_media_id: m.id,
          thumbnail_url: m.thumbnailUrl || null,
          type: 'client_work',
          sort_order: idx + 1,
          is_featured: idx === 0,
          is_visible: true,
        }));

        await serviceClient
          .from('creator_reels')
          .upsert(reelRows, { onConflict: 'creator_id,instagram_media_id' as any })
          .then(({ error: rErr }) => {
            if (rErr) console.log('[Instagram OAuth] creator_reels sync note:', rErr.message);
            else console.log(`[Instagram OAuth] Synced ${reelRows.length} reels to creator_reels`);
          });
      }
    } catch (mediaErr) {
      console.log('[Instagram OAuth] Media sync skipped:', mediaErr);
    }

    // 9. Redirect back to destination with success parameters
    const redirectUrl = new URL(returnTo, origin);
    redirectUrl.searchParams.set('ig_connected', 'true');
    redirectUrl.searchParams.set('ig_username', profile.username);
    if (typeof profile.followerCount === 'number') {
      redirectUrl.searchParams.set('ig_followers', String(profile.followerCount));
    }
    // If returning to onboarding, make sure they land on Step 4
    if (returnTo.includes('/auth/onboarding/creator') && !redirectUrl.searchParams.has('step')) {
      redirectUrl.searchParams.set('step', '4');
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: unknown) {
    console.error('Error during Instagram OAuth callback handling:', err);
    const message = err instanceof Error ? err.message : 'Failed to complete Instagram connection';
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent(message)}`
    );
  }
}
