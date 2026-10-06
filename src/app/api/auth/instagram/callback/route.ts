import { NextResponse } from 'next/server';
import { createClient, createServiceClient, getAuthenticatedUser, isServiceRoleKeyAvailable } from '@/lib/supabase/server';
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

export const INSTAGRAM_CALLBACK_VERSION = 'oauth-debug-2026-10-06-01';

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
  console.log(`[Instagram Callback] Version: ${INSTAGRAM_CALLBACK_VERSION} - Route reached.`);
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
    console.warn('[Instagram OAuth] Callback returned error parameter:', { error, errorReason, errorDescription });
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent(message)}`
    );
  }

  // 2. Validate authorization code
  if (!code) {
    console.warn('[Instagram OAuth] No code received in callback');
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('No authorization code was provided by Instagram.')}`
    );
  }

  // 3. Validate state
  if (!parsedState || !parsedState.uid) {
    console.warn('[Instagram OAuth] Invalid state received in callback:', rawState);
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Invalid or expired Instagram session state.')}`
    );
  }

  // Check state age (must be within 30 minutes)
  const age = Date.now() - (parsedState.ts || 0);
  if (age > 30 * 60 * 1000) {
    console.warn('[Instagram OAuth] State expired:', { ageMs: age });
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Instagram authorization session timed out. Please try again.')}`
    );
  }

  // 4. Verify authenticated user matches state creator UID (or has active session)
  const { user: authUser } = await getAuthenticatedUser();
  const targetUserId = authUser?.id || parsedState.uid;
  console.log(`[Instagram OAuth] Authenticated user ID: ${authUser?.id || 'none'}, State UID: ${parsedState.uid}, Target UID: ${targetUserId}`);

  if (authUser && authUser.id !== parsedState.uid) {
    console.warn('[Instagram OAuth] Authenticated user mismatch:', {
      authId: authUser.id,
      stateId: parsedState.uid,
    });
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent('Authenticated user mismatch. Please try again.')}`
    );
  }

  try {
    // 5. Server-side code exchange
    console.log('[Instagram OAuth] Attempting token exchange with Meta...');
    const tokenResult = await exchangeInstagramCode(code);
    console.log(`[Instagram OAuth] Token exchange succeeded! Instagram User ID: ${tokenResult.userId}`);

    // 6. Fetch verified Instagram profile information and supported metrics
    console.log('[Instagram OAuth] Fetching profile from Meta Graph API...');
    const profile = await fetchInstagramProfile(tokenResult.accessToken);
    console.log(
      `[Instagram OAuth] Meta Profile fetched: username: @${profile.username}, id: ${profile.id}, account_type: ${profile.accountType || 'N/A'}, followers_count: ${profile.followerCount ?? 'N/A'}`
    );

    // 7. Verify Database runtime environment & service client
    const isServiceKeyPresent = isServiceRoleKeyAvailable();
    console.log('[Instagram OAuth Diagnostic] SERVICE_ROLE_KEY_AVAILABLE =', isServiceKeyPresent);

    const serviceClient = createServiceClient();
    const userSessionClient = await createClient();
    const now = new Date().toISOString();

    // Check existing creator_profile to preserve non-Instagram creator data
    console.log(`[Instagram OAuth] Looking up creator_profiles for user_id: ${targetUserId}...`);
    const { data: existingCp, error: existingCpError } = await serviceClient
      .from('creator_profiles')
      .select('id, user_id, follower_count, instagram_connected, instagram_username, verification_status, display_name, bio, profile_image_path')
      .eq('user_id', targetUserId)
      .maybeSingle();

    console.log('[Instagram OAuth Diagnostic] Existing creator_profiles row:', {
      found: Boolean(existingCp),
      rowId: existingCp?.id || null,
      currentFollowers: existingCp?.follower_count ?? null,
      currentIgConnected: existingCp?.instagram_connected ?? null,
      currentIgUsername: existingCp?.instagram_username ?? null,
      lookupError: existingCpError?.message || null,
    });

    const followerCountToSave =
      typeof profile.followerCount === 'number' && profile.followerCount > 0
        ? profile.followerCount
        : (existingCp?.follower_count || 10000);

    const isVerifiedMetricsSource =
      typeof profile.followerCount === 'number' && profile.followerCount > 0
        ? 'instagram_meta_verified'
        : 'platform_manual';

    const updatePayload: Record<string, any> = {
      user_id: targetUserId,
      instagram_connected: true,
      instagram_verified: true,
      instagram_user_id: profile.id,
      instagram_username: profile.username,
      follower_count: followerCountToSave,
      metrics_source: isVerifiedMetricsSource,
      metrics_verified_at: now,
      verification_status: 'verified_oauth',
      instagram_connected_at: now,
      instagram_profile_data: profile.rawData || {},
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

    // Tier A: Direct UPDATE using serviceClient (preferred if row exists)
    let writeSuccess = false;
    let lastError: string | null = null;

    if (existingCp) {
      console.log(`[Instagram OAuth] Executing direct UPDATE on creator_profiles for user_id: ${targetUserId}...`);
      const { data: updateData, error: updateError } = await serviceClient
        .from('creator_profiles')
        .update(updatePayload as any)
        .eq('user_id', targetUserId)
        .select('id, user_id, instagram_connected, instagram_username, follower_count, verification_status');

      if (!updateError && updateData && updateData.length > 0) {
        writeSuccess = true;
        console.log('[Instagram OAuth] Direct UPDATE succeeded:', updateData[0]);
      } else {
        lastError = updateError?.message || 'Update returned 0 rows';
        console.warn('[Instagram OAuth] Direct UPDATE note:', lastError);
      }
    }

    // Tier B: Direct UPSERT using serviceClient
    if (!writeSuccess) {
      console.log(`[Instagram OAuth] Executing UPSERT on creator_profiles for user_id: ${targetUserId}...`);
      try {
        const { data: upsertData, error: upsertError } = await serviceClient
          .from('creator_profiles')
          .upsert(updatePayload as any, { onConflict: 'user_id' })
          .select('id, user_id, instagram_connected, instagram_username, follower_count, verification_status');

        if (!upsertError) {
          writeSuccess = true;
          console.log('[Instagram OAuth] Service client UPSERT succeeded:', upsertData);
        } else {
          lastError = upsertError.message;
          console.warn(`[Instagram OAuth] Service client UPSERT note: ${upsertError.message}`);
        }
      } catch (scErr: any) {
        lastError = scErr.message;
        console.warn('[Instagram OAuth] Service client exception:', scErr.message);
      }
    }

    // Tier C: Fallback to SECURITY DEFINER RPC
    if (!writeSuccess) {
      console.log(`[Instagram OAuth] Executing RPC save_creator_instagram_connection for user_id: ${targetUserId}...`);
      try {
        const { data: rpcData, error: rpcError } = await serviceClient.rpc('save_creator_instagram_connection', {
          p_user_id: targetUserId,
          p_instagram_user_id: profile.id,
          p_instagram_username: profile.username,
          p_follower_count: followerCountToSave,
          p_profile_data: profile.rawData || {},
          p_access_token: tokenResult.accessToken,
        } as any);

        if (!rpcError) {
          writeSuccess = true;
          console.log('[Instagram OAuth] RPC save_creator_instagram_connection succeeded:', rpcData);
        } else {
          lastError = rpcError.message;
          console.warn(`[Instagram OAuth] RPC save note: ${rpcError.message}`);
        }
      } catch (rpcErr: any) {
        lastError = rpcErr.message;
        console.warn('[Instagram OAuth] RPC exception:', rpcErr.message);
      }
    }

    // Tier D: Fallback to userSessionClient (auth.uid() = user_id)
    if (!writeSuccess) {
      console.log(`[Instagram OAuth] Executing userSessionClient write for user_id: ${targetUserId}...`);
      try {
        const { data: userClientData, error: userClientError } = await userSessionClient
          .from('creator_profiles')
          .upsert(updatePayload as any, { onConflict: 'user_id' })
          .select('id, user_id, instagram_connected, instagram_username, follower_count, verification_status');

        if (!userClientError) {
          writeSuccess = true;
          console.log('[Instagram OAuth] User session client write succeeded:', userClientData);
        } else {
          lastError = userClientError.message;
          console.error(`[Instagram OAuth] User session client error: ${userClientError.message}`);
        }
      } catch (userErr: any) {
        lastError = userErr.message;
        console.error('[Instagram OAuth] User session client exception:', userErr.message);
      }
    }

    if (!writeSuccess) {
      console.error('[Instagram OAuth] ALL write attempts failed:', lastError);
      throw new Error(`Failed to persist Instagram profile: ${lastError || 'Unknown database write error'}`);
    }

    // 8. Immediate verification read from database
    const { data: verifiedRow, error: verifyError } = await serviceClient
      .from('creator_profiles')
      .select('id, user_id, instagram_connected, instagram_username, instagram_user_id, follower_count, verification_status, metrics_source')
      .eq('user_id', targetUserId)
      .maybeSingle();

    console.log('[Instagram OAuth Diagnostic Post-Read]:', {
      verified: Boolean(verifiedRow),
      instagram_connected: verifiedRow?.instagram_connected,
      instagram_username: verifiedRow?.instagram_username,
      instagram_user_id: verifiedRow?.instagram_user_id,
      verification_status: verifiedRow?.verification_status,
      follower_count: verifiedRow?.follower_count,
      metrics_source: verifiedRow?.metrics_source,
      verifyError: verifyError?.message || null,
    });

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
