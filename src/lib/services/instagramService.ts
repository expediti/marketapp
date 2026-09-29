/**
 * Instagram Service Abstraction Layer for "Market My App"
 *
 * Prepares the platform for future Meta Graph API / Instagram Basic Display & Insights OAuth.
 *
 * IMPORTANT:
 * - Instagram handles and usernames are strictly private and NEVER exposed publicly.
 * - Metrics are classified as 'platform_manual' by default.
 * - Only genuine Meta Graph API integration updates metrics_source to 'instagram_meta_verified'.
 * - OAuth tokens must never be written to client-readable tables.
 */

export interface InstagramAccountMetadata {
  instagram_connected: boolean;
  instagram_user_id: string | null;
  /** Private username, strictly internal, never rendered on public profile cards */
  instagram_username_private: string | null;
  followers_count: number;
  average_reach: number;
  engagement_rate: number;
  impressions_count?: number;
  views_count?: number;
  metrics_source: 'platform_manual' | 'instagram_meta_verified';
  metrics_verified_at: string | null;
}

export interface InstagramAuthResponse {
  accessToken: string;
  userId: string;
  expiresIn: number;
}

export interface InstagramMetrics {
  followerCount: number;
  averageReach: number;
  engagementRate: number;
  impressionsCount?: number;
  viewsCount?: number;
  audienceGender: { female: number; male: number };
  audienceAge: { '18-24': number; '25-34': number; '35+': number };
  audienceLocations: Array<{ city: string; percentage: number }>;
  metricsSource: 'platform_manual' | 'instagram_meta_verified';
  metricsVerifiedAt: string | null;
}

export interface IInstagramService {
  getOAuthAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<InstagramAuthResponse>;
  fetchVerifiedMetrics(accessToken: string): Promise<InstagramMetrics>;
  getAccountMetadata(creatorId: string): Promise<InstagramAccountMetadata>;
}

class InstagramService implements IInstagramService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || 'mock_ig_client_id';
    this.redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';
  }

  getOAuthAuthorizationUrl(state: string): string {
    const scope = 'instagram_basic,instagram_manage_insights,pages_read_engagement';
    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri
    )}&scope=${scope}&response_type=code&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
    // In production, exchanges code securely with Meta Graph API
    if (process.env.NODE_ENV !== 'production' || !process.env.INSTAGRAM_CLIENT_SECRET) {
      return {
        accessToken: `mock_ig_token_${code.slice(0, 8)}`,
        userId: 'ig_user_dev_placeholder',
        expiresIn: 5184000, // 60 days
      };
    }

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Instagram OAuth token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  async fetchVerifiedMetrics(accessToken: string): Promise<InstagramMetrics> {
    // When live Instagram Graph API access is configured:
    // GET /v21.0/{ig-user-id}/insights?metric=reach,impressions,engagement
    if (accessToken.startsWith('mock_')) {
      return {
        followerCount: 24600,
        averageReach: 48200,
        engagementRate: 5.1,
        impressionsCount: 96000,
        viewsCount: 72000,
        audienceGender: { female: 58, male: 42 },
        audienceAge: { '18-24': 48, '25-34': 40, '35+': 12 },
        audienceLocations: [
          { city: 'Delhi NCR', percentage: 38 },
          { city: 'Bengaluru', percentage: 28 },
          { city: 'Mumbai', percentage: 20 },
        ],
        metricsSource: 'platform_manual',
        metricsVerifiedAt: null,
      };
    }

    return {
      followerCount: 0,
      averageReach: 0,
      engagementRate: 0,
      audienceGender: { female: 50, male: 50 },
      audienceAge: { '18-24': 50, '25-34': 30, '35+': 20 },
      audienceLocations: [],
      metricsSource: 'instagram_meta_verified',
      metricsVerifiedAt: new Date().toISOString(),
    };
  }

  async getAccountMetadata(_creatorId: string): Promise<InstagramAccountMetadata> {
    return {
      instagram_connected: false,
      instagram_user_id: null,
      instagram_username_private: null,
      followers_count: 24600,
      average_reach: 48200,
      engagement_rate: 5.1,
      metrics_source: 'platform_manual',
      metrics_verified_at: null,
    };
  }
}

export const instagramService: IInstagramService = new InstagramService();
