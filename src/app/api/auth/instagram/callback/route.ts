import { NextResponse } from 'next/server';
import { createClient, createServiceClient, getAuthenticatedUser, isServiceRoleKeyAvailable } from '@/lib/supabase/server';
import {
  exchangeInstagramCode,
  fetchInstagramProfile,
  fetchInstagramUserMedia,
  getInstagramCredentials,
} from '@/lib/server/instagram';
import { getServerRuntimeSecret } from '@/lib/server/razorpay';

export const dynamic = 'force-dynamic';

export const INSTAGRAM_CALLBACK_VERSION = 'oauth-instrumented-2026-10-06-02';

function extractProjectRef(url: string | undefined): string {
  if (!url) return 'undefined';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return host.split('.')[0] || host;
  } catch {
    return 'invalid_url';
  }
}

function getOrigin(request: Request): string {
  const host = request.headers.get('host');
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    return `http://${host}`;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (siteUrl && !siteUrl.includes('localhost')) {
    return siteUrl;
  }
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return 'https://marketmyidea.online';
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
    console.error('[Instagram OAuth] Failed to parse state parameter:', e);
  }
  return null;
}

function renderErrorPage(step: string, errorDetails: string, contextData: Record<string, any>, returnOrigin: string = 'https://marketmyidea.online'): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Instagram OAuth Diagnostic Failure</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0d0e; color: #f4f4f5; padding: 2rem; margin: 0; }
    .container { max-width: 720px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 2rem; }
    h1 { color: #ef4444; font-size: 1.5rem; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #ef444420; color: #f87171; border: 1px solid #ef444440; margin-bottom: 1rem; }
    .step { font-weight: 600; color: #38bdf8; margin-bottom: 0.5rem; }
    pre { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 1rem; overflow-x: auto; color: #a1a1aa; font-size: 13px; }
    a { color: #f97316; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">CALLBACK EXECUTION ERROR</div>
    <h1>Instagram Connection Failed</h1>
    <div class="step">Failed at Step: ${step}</div>
    <p><strong>Error:</strong> ${errorDetails}</p>
    <h3>Diagnostic Context</h3>
    <pre>${JSON.stringify(contextData, null, 2)}</pre>
    <div style="margin-top: 1.5rem;">
      <a href="${returnOrigin}/dashboard/creator">← Return to Creator Dashboard</a>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 500,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * GET /api/auth/instagram/callback
 * Production Callback URL: https://marketapp.expeditionthe0.workers.dev/api/auth/instagram/callback
 */
export async function GET(request: Request) {
  const logPrefix = `[Instagram Callback ${INSTAGRAM_CALLBACK_VERSION}]`;
  console.log(`${logPrefix} Hit timestamp: ${new Date().toISOString()}`);

  const origin = getOrigin(request);
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');
  const rawState = searchParams.get('state');

  const parsedState = parseState(rawState);
  const returnTo = parsedState?.ret || '/dashboard/creator';

  const rawUrl =
    getServerRuntimeSecret('NEXT_PUBLIC_SUPABASE_URL') ||
    getServerRuntimeSecret('SUPABASE_URL') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const projectRef = extractProjectRef(rawUrl);
  const serviceRoleAvailable = isServiceRoleKeyAvailable();

  console.log(`${logPrefix} Environment: projectRef=${projectRef}, serviceRoleAvailable=${serviceRoleAvailable}`);

  // Step 1: Handle user cancellation or OAuth provider error
  if (error || errorReason) {
    const errorMsg = errorDescription || errorReason || error || 'Instagram authorization was cancelled.';
    console.warn(`${logPrefix} Step 1 Error: Meta OAuth returned error param:`, { error, errorReason, errorDescription });
    return renderErrorPage('1_META_OAUTH_REJECTED', errorMsg, {
      version: INSTAGRAM_CALLBACK_VERSION,
      error,
      errorReason,
      errorDescription,
    });
  }

  // Step 2: Validate authorization code
  if (!code) {
    console.warn(`${logPrefix} Step 2 Error: No code received in query parameters.`);
    return renderErrorPage('2_NO_AUTH_CODE', 'No authorization code provided by Instagram.', {
      version: INSTAGRAM_CALLBACK_VERSION,
      searchParams: Object.fromEntries(searchParams.entries()),
    });
  }

  // Step 3: Validate state parameter
  if (!parsedState || !parsedState.uid) {
    console.warn(`${logPrefix} Step 3 Error: Invalid state parameter:`, rawState);
    return renderErrorPage('3_INVALID_STATE', 'Invalid or expired Instagram session state.', {
      version: INSTAGRAM_CALLBACK_VERSION,
      rawState: rawState ? `${rawState.slice(0, 10)}...` : null,
    });
  }

  const stateAgeMs = Date.now() - (parsedState.ts || 0);
  if (stateAgeMs > 30 * 60 * 1000) {
    console.warn(`${logPrefix} Step 3 Error: State expired (${stateAgeMs}ms old).`);
    return renderErrorPage('3_EXPIRED_STATE', 'Instagram authorization session timed out. Please try again.', {
      version: INSTAGRAM_CALLBACK_VERSION,
      stateAgeMs,
    });
  }

  // Step 4: Identify target user
  const { user: authUser, error: authError } = await getAuthenticatedUser();
  const targetUserId = authUser?.id || parsedState.uid;
  console.log(
    `${logPrefix} Step 4 User Identification: authUser.id=${authUser?.id || 'none'}, state.uid=${parsedState.uid}, resolved targetUserId=${targetUserId}`
  );

  if (authUser && authUser.id !== parsedState.uid) {
    console.warn(`${logPrefix} Step 4 Warning: Authenticated user mismatch: authId=${authUser.id}, stateUid=${parsedState.uid}`);
    return renderErrorPage('4_USER_MISMATCH', 'Active session user ID does not match OAuth session initiator.', {
      version: INSTAGRAM_CALLBACK_VERSION,
      authUser: authUser.id,
      stateUser: parsedState.uid,
    });
  }

  // Step 5: Server-side token exchange with Meta
  let tokenResult: { accessToken: string; userId: string; expiresIn?: number };
  try {
    console.log(`${logPrefix} Step 5: Exchanging authorization code with Meta...`);
    tokenResult = await exchangeInstagramCode(code);
    console.log(`${logPrefix} Step 5 Succeeded: Meta User ID=${tokenResult.userId}`);
  } catch (tokenErr: any) {
    console.error(`${logPrefix} Step 5 Failed: Token exchange error:`, tokenErr);
    return renderErrorPage('5_TOKEN_EXCHANGE_FAILED', tokenErr.message || 'Token exchange failed', {
      version: INSTAGRAM_CALLBACK_VERSION,
      targetUserId,
    });
  }

  // Step 6: Fetch verified profile from Instagram Graph API
  let profile: any;
  try {
    console.log(`${logPrefix} Step 6: Fetching profile data from Meta Graph API...`);
    profile = await fetchInstagramProfile(tokenResult.accessToken);
    console.log(
      `${logPrefix} Step 6 Succeeded: username=@${profile.username}, id=${profile.id}, followers=${profile.followerCount ?? 'N/A'}`
    );
  } catch (profileErr: any) {
    console.error(`${logPrefix} Step 6 Failed: Profile fetch error:`, profileErr);
    return renderErrorPage('6_PROFILE_FETCH_FAILED', profileErr.message || 'Graph API profile fetch failed', {
      version: INSTAGRAM_CALLBACK_VERSION,
      metaUserId: tokenResult.userId,
      targetUserId,
    });
  }

  // Step 7: Initialize Database Service-Role Client
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  // Check existing creator_profiles row
  const { data: existingCp, error: existingCpErr } = await serviceClient
    .from('creator_profiles')
    .select('id, user_id, follower_count, instagram_connected, instagram_username, verification_status')
    .eq('user_id', targetUserId)
    .maybeSingle();

  console.log(`${logPrefix} Step 7: Existing creator_profile lookup:`, {
    found: Boolean(existingCp),
    id: existingCp?.id || null,
    user_id: existingCp?.user_id || null,
    follower_count: existingCp?.follower_count ?? null,
    instagram_connected: existingCp?.instagram_connected ?? null,
    error: existingCpErr?.message || null,
  });

  const followerCountToSave =
    typeof profile.followerCount === 'number' && profile.followerCount > 0
      ? profile.followerCount
      : (existingCp?.follower_count || 10000);

  // Step 8: Execute RPC save_creator_instagram_connection
  console.log(`${logPrefix} Step 8: Executing RPC public.save_creator_instagram_connection...`);
  let rpcSuccess = false;
  let rpcDataResult: any = null;
  let rpcErrorMessage: string | null = null;

  try {
    const { data: rpcData, error: rpcError } = await serviceClient.rpc('save_creator_instagram_connection', {
      p_user_id: targetUserId,
      p_instagram_user_id: profile.id,
      p_instagram_username: profile.username,
      p_follower_count: followerCountToSave,
      p_profile_data: profile.rawData || {},
      p_access_token: tokenResult.accessToken,
    } as any);

    if (rpcError) {
      rpcErrorMessage = rpcError.message;
      console.error(`${logPrefix} Step 8 RPC Error:`, rpcError);
    } else {
      rpcSuccess = true;
      rpcDataResult = rpcData;
      console.log(`${logPrefix} Step 8 RPC Succeeded:`, rpcData);
    }
  } catch (rpcExc: any) {
    rpcErrorMessage = rpcExc.message || 'RPC invocation exception';
    console.error(`${logPrefix} Step 8 RPC Exception:`, rpcExc);
  }

  // Step 9: Fallback direct UPDATE / UPSERT if RPC fails
  let writeSucceeded = rpcSuccess;
  let fallbackErrorMsg: string | null = null;

  if (!writeSucceeded) {
    console.log(`${logPrefix} Step 9: Attempting direct service-role UPDATE/UPSERT fallback...`);
    const updatePayload: Record<string, any> = {
      user_id: targetUserId,
      instagram_connected: true,
      instagram_verified: true,
      instagram_user_id: profile.id,
      instagram_username: profile.username,
      follower_count: followerCountToSave,
      verification_status: 'verified_oauth',
      metrics_source: 'instagram_meta_verified',
      metrics_verified_at: now,
      instagram_connected_at: now,
      instagram_profile_data: profile.rawData || {},
      instagram_access_token: tokenResult.accessToken,
      updated_at: now,
    };

    if (existingCp) {
      const { data: directUpdateData, error: directUpdateError } = await serviceClient
        .from('creator_profiles')
        .update(updatePayload as any)
        .eq('user_id', targetUserId)
        .select('id, user_id, instagram_connected, instagram_username, verification_status');

      if (!directUpdateError && directUpdateData && directUpdateData.length > 0) {
        writeSucceeded = true;
        console.log(`${logPrefix} Step 9 Direct UPDATE Succeeded:`, directUpdateData[0]);
      } else {
        fallbackErrorMsg = directUpdateError?.message || 'Direct update affected 0 rows';
        console.warn(`${logPrefix} Step 9 Direct UPDATE Failed:`, fallbackErrorMsg);
      }
    } else {
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

      const { data: upsertData, error: upsertErr } = await serviceClient
        .from('creator_profiles')
        .upsert(updatePayload as any, { onConflict: 'user_id' })
        .select('id, user_id, instagram_connected, instagram_username, verification_status');

      if (!upsertErr && upsertData && upsertData.length > 0) {
        writeSucceeded = true;
        console.log(`${logPrefix} Step 9 Direct UPSERT Succeeded:`, upsertData[0]);
      } else {
        fallbackErrorMsg = upsertErr?.message || 'Direct upsert failed';
        console.warn(`${logPrefix} Step 9 Direct UPSERT Failed:`, fallbackErrorMsg);
      }
    }
  }

  // If ALL persistence mechanisms failed, return detailed diagnostic error page
  if (!writeSucceeded) {
    console.error(`${logPrefix} Step 9 Fatal: Database write failed completely.`);
    return renderErrorPage('9_DATABASE_WRITE_FAILED', rpcErrorMessage || fallbackErrorMsg || 'All write methods failed', {
      version: INSTAGRAM_CALLBACK_VERSION,
      projectRef,
      serviceRoleAvailable,
      targetUserId,
      instagramUser: `@${profile.username} (${profile.id})`,
      rpcError: rpcErrorMessage,
      fallbackError: fallbackErrorMsg,
    });
  }

  // Step 10: Immediate verification read
  console.log(`${logPrefix} Step 10: Executing verification read from creator_profiles...`);
  const { data: verifiedRow, error: verifyError } = await serviceClient
    .from('creator_profiles')
    .select('id, user_id, instagram_connected, instagram_verified, instagram_username, instagram_user_id, follower_count, verification_status, metrics_source, instagram_profile_data, updated_at')
    .eq('user_id', targetUserId)
    .maybeSingle();

  console.log(`${logPrefix} Step 10 Verification Result:`, verifiedRow);

  const isRowVerified = Boolean(
    verifiedRow &&
    verifiedRow.instagram_connected === true &&
    verifiedRow.instagram_username === profile.username &&
    verifiedRow.verification_status === 'verified_oauth'
  );

  if (!isRowVerified) {
    console.error(`${logPrefix} Step 10 Verification Mismatch:`, { verifiedRow, expectedUsername: profile.username });
    return renderErrorPage('10_VERIFICATION_READ_MISMATCH', 'Database write completed but immediate verification read showed unexpected values.', {
      version: INSTAGRAM_CALLBACK_VERSION,
      targetUserId,
      expected: {
        instagram_connected: true,
        instagram_username: profile.username,
        verification_status: 'verified_oauth',
      },
      actual: verifiedRow || null,
      verifyError: verifyError?.message || null,
    });
  }

  // Step 11: Non-blocking sync for user media / reels & user profile avatar
  try {
    if (profile.profilePictureUrl) {
      await Promise.all([
        serviceClient
          .from('profiles')
          .update({ avatar_url: profile.profilePictureUrl, updated_at: now })
          .eq('id', targetUserId),
        serviceClient
          .from('creator_profiles')
          .update({ profile_image_path: profile.profilePictureUrl, updated_at: now })
          .eq('user_id', targetUserId),
      ]);
    }
  } catch (profErr) {
    console.warn(`${logPrefix} Profile avatar update note:`, profErr);
  }

  try {
    const mediaItems = await fetchInstagramUserMedia(tokenResult.accessToken);
    if (mediaItems && mediaItems.length > 0) {
      // 1. Store recent media metadata in creator_profiles.instagram_profile_data
      const rawProfileData = verifiedRow?.instagram_profile_data;
      const existingProfileData: Record<string, unknown> =
        typeof rawProfileData === 'object' && rawProfileData !== null && !Array.isArray(rawProfileData)
          ? (rawProfileData as Record<string, unknown>)
          : (profile.rawData || {});

      const updatedProfileData = {
        ...existingProfileData,
        recent_media: mediaItems.map((m) => ({
          id: m.id,
          caption: m.caption || null,
          media_type: m.mediaType,
          media_product_type: m.mediaProductType || null,
          permalink: m.permalink || null,
          thumbnail_url: m.thumbnailUrl || null,
          timestamp: m.timestamp || null,
          like_count: m.likeCount ?? null,
          comments_count: m.commentsCount ?? null,
        })),
        last_media_synced_at: now,
      };

      await serviceClient
        .from('creator_profiles')
        .update({
          instagram_profile_data: updatedProfileData,
          updated_at: now,
        })
        .eq('user_id', targetUserId);

      // 2. Resiliently upsert into creator_reels table
      const { data: existingReels } = await serviceClient
        .from('creator_reels')
        .select('id, instagram_media_id')
        .eq('creator_id', targetUserId);

      const existingMap = new Map<string, string>();
      if (Array.isArray(existingReels)) {
        for (const r of existingReels) {
          if (r.instagram_media_id) {
            existingMap.set(r.instagram_media_id, r.id);
          }
        }
      }

      for (let idx = 0; idx < mediaItems.length; idx++) {
        const m = mediaItems[idx];
        const title = m.caption ? (m.caption.length > 70 ? `${m.caption.slice(0, 67)}...` : m.caption) : `Instagram Reel #${idx + 1}`;
        const description = m.caption || null;
        const reelUrl = m.permalink || m.mediaUrl || null;
        const videoUrl = m.permalink || m.mediaUrl || '';
        const thumbnailUrl = m.thumbnailUrl || m.mediaUrl || null;

        const existingId = existingMap.get(m.id);
        if (existingId) {
          await serviceClient
            .from('creator_reels')
            .update({
              title,
              description,
              video_url: videoUrl,
              reel_url: reelUrl,
              thumbnail_url: thumbnailUrl,
              sort_order: idx + 1,
              updated_at: now,
            })
            .eq('id', existingId);
        } else {
          await serviceClient
            .from('creator_reels')
            .insert({
              creator_id: targetUserId,
              title,
              description,
              video_url: videoUrl,
              reel_url: reelUrl,
              instagram_media_id: m.id,
              thumbnail_url: thumbnailUrl,
              type: 'client_work',
              sort_order: idx + 1,
              is_featured: idx === 0,
              is_visible: true,
            });
        }
      }

      console.log(`${logPrefix} Successfully synced ${mediaItems.length} media items to creator_reels & profile data.`);
    }
  } catch (mediaErr) {
    console.log(`${logPrefix} Media sync skipped:`, mediaErr);
  }

  // Step 12: Redirect with success parameters
  console.log(`${logPrefix} Step 12: All verifications passed! Redirecting to ${returnTo}...`);
  const redirectUrl = new URL(returnTo, origin);
  redirectUrl.searchParams.set('ig_connected', 'true');
  redirectUrl.searchParams.set('ig_username', profile.username);
  if (typeof profile.followerCount === 'number') {
    redirectUrl.searchParams.set('ig_followers', String(profile.followerCount));
  }
  if (returnTo.includes('/auth/onboarding/creator') && !redirectUrl.searchParams.has('step')) {
    redirectUrl.searchParams.set('step', '4');
  }

  return NextResponse.redirect(redirectUrl.toString());
}
