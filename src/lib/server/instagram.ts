import { getServerRuntimeSecret } from '@/lib/server/razorpay';

export const INSTAGRAM_PRODUCTION_REDIRECT_URI =
  'https://marketmyidea.online/api/auth/instagram/callback';

export interface InstagramCredentials {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface InstagramTokenExchangeResult {
  accessToken: string;
  userId: string;
  expiresIn?: number;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  accountType?: string;
  mediaCount?: number;
  followerCount?: number | null;
  profilePictureUrl?: string | null;
  biography?: string | null;
  rawData: Record<string, any>;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  mediaType: string;
  mediaProductType?: string;
  mediaUrl?: string;
  permalink?: string;
  thumbnailUrl?: string;
  timestamp?: string;
  likeCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  reach?: number;
  saved?: number;
  shares?: number;
}

/**
 * Retrieves server-side Instagram App ID and App Secret using the
 * Cloudflare/OpenNext runtime context pattern.
 * NEVER expose INSTAGRAM_APP_SECRET to the client.
 */
export function getInstagramCredentials(): InstagramCredentials {
  const appId =
    getServerRuntimeSecret('INSTAGRAM_APP_ID') ||
    getServerRuntimeSecret('INSTAGRAM_CLIENT_ID') ||
    process.env.INSTAGRAM_APP_ID ||
    process.env.INSTAGRAM_CLIENT_ID ||
    '';

  const appSecret =
    getServerRuntimeSecret('INSTAGRAM_APP_SECRET') ||
    getServerRuntimeSecret('INSTAGRAM_CLIENT_SECRET') ||
    process.env.INSTAGRAM_APP_SECRET ||
    process.env.INSTAGRAM_CLIENT_SECRET ||
    '';

  const redirectUri =
    getServerRuntimeSecret('INSTAGRAM_REDIRECT_URI') ||
    process.env.INSTAGRAM_REDIRECT_URI ||
    INSTAGRAM_PRODUCTION_REDIRECT_URI;

  return {
    appId,
    appSecret,
    redirectUri,
  };
}

/**
 * Builds the official Instagram OAuth Authorization URL.
 * Uses Meta's "Instagram API with Instagram Login" product (Graph API).
 * Requests the standard creator 'instagram_business_basic' scope.
 */
export function buildInstagramAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramCredentials();

  if (!appId) {
    throw new Error('INSTAGRAM_APP_ID is not configured in server secrets.');
  }

  const scope = 'instagram_business_basic';

  const params = new URLSearchParams({
    enable_fb_login: '0',
    force_authentication: '1',
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Server-side exchange of authorization code for an Instagram access token.
 */
export async function exchangeInstagramCode(code: string): Promise<InstagramTokenExchangeResult> {
  const { appId, appSecret, redirectUri } = getInstagramCredentials();

  if (!appId || !appSecret) {
    throw new Error(
      'Server-side Instagram credentials (INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET) are missing or not configured.'
    );
  }

  const formData = new URLSearchParams();
  formData.append('client_id', appId);
  formData.append('client_secret', appSecret);
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', redirectUri);
  formData.append('code', code);

  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Instagram token exchange failed:', response.status, errorText);
    throw new Error(`Instagram token exchange failed: ${response.statusText}`);
  }

  const data = (await response.json()) as any;

  if (data.error_message || data.error_type) {
    throw new Error(data.error_message || 'Instagram token exchange returned error');
  }

  return {
    accessToken: data.access_token,
    userId: String(data.user_id || ''),
    expiresIn: data.expires_in,
  };
}

/**
 * Fetches verified Instagram profile information and supported metrics.
 * Requests all available Graph API fields (id, username, account_type, media_count,
 * followers_count, profile_picture_url, biography) with resilient fallback.
 */
export async function fetchInstagramProfile(accessToken: string): Promise<InstagramUserProfile> {
  const fields = 'id,username,account_type,media_count,followers_count,profile_picture_url,biography';
  
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${accessToken}`
    );

    if (res.ok) {
      const data = (await res.json()) as any;
      const returnedFields = data ? Object.keys(data) : [];
      console.log(`[Instagram Graph API] /me HTTP 200. User ID: ${data?.id}, Username: @${data?.username}, Returned fields: [${returnedFields.join(', ')}]`);

      if (data && data.username) {
        return {
          id: String(data.id),
          username: data.username,
          accountType: data.account_type,
          mediaCount: typeof data.media_count === 'number' ? data.media_count : undefined,
          followerCount: typeof data.followers_count === 'number' ? data.followers_count : null,
          profilePictureUrl: data.profile_picture_url || null,
          biography: data.biography || null,
          rawData: data,
        };
      }
    } else {
      const errorJson = (await res.json().catch(() => null)) as any;
      const sanitizedMsg = errorJson?.error?.message || res.statusText;
      const sanitizedCode = errorJson?.error?.code || res.status;
      const sanitizedType = errorJson?.error?.type || 'GraphMethodException';
      console.warn(`[Instagram Graph API] /me HTTP ${res.status} error: [${sanitizedCode}] (${sanitizedType}) ${sanitizedMsg}. Attempting resilient fallback...`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Instagram Graph API] /me request threw: ${errorMsg}. Falling back to core fields...`);
  }

  // 2. Resilient fallback: fetch core fields first, then optional fields
  let coreData: any = null;
  try {
    const coreRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );
    if (coreRes.ok) {
      coreData = await coreRes.json();
      console.log(`[Instagram Graph API] /me core fields succeeded: User ID: ${coreData?.id}, Username: @${coreData?.username}`);
    } else {
      const legacyRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );
      if (legacyRes.ok) {
        coreData = await legacyRes.json();
      }
    }
  } catch (coreErr) {
    console.warn('[Instagram Graph API] Core fields query error:', coreErr);
  }

  if (!coreData || !coreData.username) {
    throw new Error('Failed to fetch Instagram profile data from Graph API.');
  }

  // 3. Attempt optional fields separately without failing the connection
  let followerCount: number | null = null;
  let profilePictureUrl: string | null = null;
  let biography: string | null = null;

  try {
    const extraRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=followers_count,profile_picture_url,biography&access_token=${accessToken}`
    );
    if (extraRes.ok) {
      const extraData = await extraRes.json();
      if (typeof extraData.followers_count === 'number') followerCount = extraData.followers_count;
      if (extraData.profile_picture_url) profilePictureUrl = extraData.profile_picture_url;
      if (extraData.biography) biography = extraData.biography;
    }
  } catch {
    // Optional metrics query is non-fatal
  }

  return {
    id: String(coreData.id),
    username: coreData.username || '',
    accountType: coreData.account_type,
    mediaCount: typeof coreData.media_count === 'number' ? coreData.media_count : undefined,
    followerCount,
    profilePictureUrl,
    biography,
    rawData: { ...coreData, followerCount, profilePictureUrl, biography },
  };
}

/**
 * Fetches recent user media/reels from Instagram Graph API (up to 12 items).
 * Non-blocking: failure to fetch media never interrupts account verification.
 */
export async function fetchInstagramUserMedia(accessToken: string): Promise<InstagramMediaItem[]> {
  const fullFields = 'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
  const coreFields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';

  // 1. Try fetching with full fields including engagement
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=${fullFields}&limit=12&access_token=${accessToken}`
    );

    if (res.ok) {
      const data = (await res.json()) as any;
      const items = Array.isArray(data?.data) ? data.data : [];
      console.log(`[Instagram Graph API] /me/media fetched ${items.length} media items with full fields.`);

      return items.map((m: any) => ({
        id: String(m.id),
        caption: m.caption || undefined,
        mediaType: m.media_type || 'VIDEO',
        mediaProductType: m.media_product_type || undefined,
        mediaUrl: m.media_url || undefined,
        permalink: m.permalink || undefined,
        thumbnailUrl: m.thumbnail_url || m.media_url || undefined,
        timestamp: m.timestamp || undefined,
        likeCount: typeof m.like_count === 'number' ? m.like_count : undefined,
        commentsCount: typeof m.comments_count === 'number' ? m.comments_count : undefined,
      }));
    } else {
      const errorJson = (await res.json().catch(() => null)) as any;
      console.log(
        `[Instagram Graph API] /me/media with full fields HTTP ${res.status}: ${errorJson?.error?.message || res.statusText}. Retrying with core fields...`
      );
    }
  } catch (err) {
    console.warn('[Instagram Graph API] /me/media full fields query error:', err);
  }

  // 2. Fallback to core fields
  try {
    const fallbackRes = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=${coreFields}&limit=12&access_token=${accessToken}`
    );

    if (fallbackRes.ok) {
      const data = (await fallbackRes.json()) as any;
      const items = Array.isArray(data?.data) ? data.data : [];
      console.log(`[Instagram Graph API] /me/media fallback fetched ${items.length} media items.`);

      return items.map((m: any) => ({
        id: String(m.id),
        caption: m.caption || undefined,
        mediaType: m.media_type || 'VIDEO',
        mediaUrl: m.media_url || undefined,
        permalink: m.permalink || undefined,
        thumbnailUrl: m.thumbnail_url || m.media_url || undefined,
        timestamp: m.timestamp || undefined,
      }));
    } else {
      const errData = (await fallbackRes.json().catch(() => null)) as any;
      console.log(`[Instagram Graph API] /me/media fallback HTTP ${fallbackRes.status}: ${errData?.error?.message || fallbackRes.statusText}`);
      return [];
    }
  } catch (coreErr) {
    console.log('[Instagram Graph API] /me/media fallback skipped:', coreErr);
    return [];
  }
}

/**
 * Retrieves the server-side Instagram Webhook Verification Token.
 * Cloudflare Production Secret: INSTAGRAM_WEBHOOK_VERIFY_TOKEN
 * NEVER expose this secret to the client.
 */
export function getInstagramWebhookVerifyToken(): string {
  const token =
    getServerRuntimeSecret('INSTAGRAM_WEBHOOK_VERIFY_TOKEN') ||
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
    '';
  return token;
}

/**
 * Validates Meta's Webhook verification challenge (GET request).
 * Meta sends hub.mode, hub.verify_token, and hub.challenge.
 */
export function verifyInstagramWebhookChallenge(
  mode: string | null,
  verifyToken: string | null,
  challenge: string | null
): { isValid: boolean; challenge?: string } {
  const configuredToken = getInstagramWebhookVerifyToken();

  if (!configuredToken) {
    console.warn(
      'INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not configured in server secrets. Webhook verification will fail.'
    );
    return { isValid: false };
  }

  if (mode === 'subscribe' && verifyToken && challenge && verifyToken === configuredToken) {
    return { isValid: true, challenge };
  }

  return { isValid: false };
}

export interface InstagramWebhookEventEntry {
  id: string;
  time: number;
  changes?: Array<{
    field: string;
    value: Record<string, any>;
  }>;
  messaging?: Array<Record<string, any>>;
  standby?: Array<Record<string, any>>;
}

export interface InstagramWebhookPayload {
  object: string;
  entry?: InstagramWebhookEventEntry[];
}
