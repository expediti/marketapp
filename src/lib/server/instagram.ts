import { getServerRuntimeSecret } from '@/lib/server/razorpay';

export const INSTAGRAM_PRODUCTION_REDIRECT_URI =
  'https://marketapp.expeditionthe0.workers.dev/api/auth/instagram/callback';

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
  rawData: Record<string, any>;
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

  return {
    appId,
    appSecret,
    redirectUri: INSTAGRAM_PRODUCTION_REDIRECT_URI,
  };
}

/**
 * Builds the official Instagram OAuth Authorization URL.
 * Requests standard creator profile scopes.
 */
export function buildInstagramAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramCredentials();

  if (!appId) {
    throw new Error('INSTAGRAM_APP_ID is not configured in server secrets.');
  }

  // Instagram API scopes for profile & media insights
  // user_profile: basic username & account ID
  // user_media: access to media & reels
  // instagram_business_basic: for creator/business profiles with metrics
  const scope = 'user_profile,user_media,instagram_business_basic';

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope,
    response_type: 'code',
    state,
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
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
 * Note: Instagram Basic Display permissions only provide username, id, account_type, media_count.
 * If followers_count is supported by the granted scope (Instagram Graph API for Creator/Business),
 * it is extracted directly without fabricating numbers.
 */
export async function fetchInstagramProfile(accessToken: string): Promise<InstagramUserProfile> {
  // 1. Try querying Instagram Graph API with followers_count
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,account_type,media_count,followers_count&access_token=${accessToken}`
    );

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.username) {
        return {
          id: String(data.id),
          username: data.username,
          accountType: data.account_type,
          mediaCount: typeof data.media_count === 'number' ? data.media_count : undefined,
          followerCount: typeof data.followers_count === 'number' ? data.followers_count : null,
          rawData: data,
        };
      }
    }
  } catch (err) {
    console.warn('Querying graph.instagram.com/v21.0/me failed, falling back:', err);
  }

  // 2. Fallback to basic me endpoint
  const fallbackRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  );

  if (!fallbackRes.ok) {
    const errorText = await fallbackRes.text();
    console.error('Instagram profile fetch failed:', fallbackRes.status, errorText);
    throw new Error(`Failed to fetch Instagram profile data: ${fallbackRes.statusText}`);
  }

  const fallbackData = (await fallbackRes.json()) as any;

  return {
    id: String(fallbackData.id),
    username: fallbackData.username || '',
    accountType: fallbackData.account_type,
    mediaCount: typeof fallbackData.media_count === 'number' ? fallbackData.media_count : undefined,
    followerCount: null, // Basic scope does not provide follower count; not fabricated
    rawData: fallbackData,
  };
}
