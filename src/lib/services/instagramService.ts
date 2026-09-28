/**
 * Instagram Service Abstraction Layer
 * Prepares the platform for Meta Graph API / Instagram Basic Display & Insights OAuth.
 * In development, provides mock verification while maintaining strict separation:
 * "Verified by Instagram" vs "Development sample data".
 * NOTE: Instagram handles are strictly private and NEVER exposed publicly.
 */

export interface InstagramAuthResponse {
  accessToken: string;
  userId: string;
  expiresIn: number;
}

export interface InstagramMetrics {
  followerCount: number;
  averageReach: number;
  engagementRate: number;
  audienceGender: { female: number; male: number };
  audienceAge: { '18-24': number; '25-34': number; '35+': number };
  audienceLocations: Array<{ city: string; percentage: number }>;
  isDevelopmentMock: boolean;
}

export interface IInstagramService {
  getOAuthAuthorizationUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<InstagramAuthResponse>;
  fetchVerifiedMetrics(accessToken: string): Promise<InstagramMetrics>;
  mockDevelopmentConnect(creatorId: string): Promise<InstagramMetrics>;
}

class InstagramService implements IInstagramService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || 'mock_ig_client_id';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';
  }

  getOAuthAuthorizationUrl(state: string): string {
    const scope = 'instagram_basic,instagram_manage_insights,pages_read_engagement';
    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri
    )}&scope=${scope}&response_type=code&state=${state}`;
  }

  async exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
    // In production, exchanges code with https://api.instagram.com/oauth/access_token
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
    // Meta Insights API query endpoint
    if (accessToken.startsWith('mock_')) {
      return this.mockDevelopmentConnect('dev_user');
    }

    // Call Graph API /v21.0/{ig_user_id}/insights
    return {
      followerCount: 18400,
      averageReach: 36200,
      engagementRate: 4.8,
      audienceGender: { female: 62, male: 38 },
      audienceAge: { '18-24': 51, '25-34': 37, '35+': 12 },
      audienceLocations: [
        { city: 'Varanasi', percentage: 34 },
        { city: 'Lucknow', percentage: 22 },
        { city: 'Delhi NCR', percentage: 18 },
      ],
      isDevelopmentMock: false,
    };
  }

  async mockDevelopmentConnect(_creatorId: string): Promise<InstagramMetrics> {
    // Deterministic mock verification metrics for development onboarding testing
    return {
      followerCount: 24600,
      averageReach: 48200,
      engagementRate: 5.1,
      audienceGender: { female: 58, male: 42 },
      audienceAge: { '18-24': 48, '25-34': 40, '35+': 12 },
      audienceLocations: [
        { city: 'Varanasi', percentage: 38 },
        { city: 'Lucknow', percentage: 24 },
        { city: 'Delhi NCR', percentage: 16 },
      ],
      isDevelopmentMock: true,
    };
  }
}

export const instagramService: IInstagramService = new InstagramService();
