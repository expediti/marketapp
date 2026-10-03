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
 * Uses Meta's "Instagram API with Instagram Login" product (Graph API).
 * Requests the standard creator 'instagram_business_basic' scope.
 */
export function buildInstagramAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramCredentials();

  if (!appId) {
    throw new Error('INSTAGRAM_APP_ID is not configured in server secrets.');
  }

  // Meta "Instagram API with Instagram Login" permission scope.
  // Note: 'user_profile' and 'user_media' are deprecated Instagram Basic Display API
  // permissions (sunset Dec 2024). Requesting them against modern Meta apps causes
  // "Invalid platform app" / "Request parameters are invalid".
  // 'instagram_business_basic' is the current valid scope for Creator profile & metrics.
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
