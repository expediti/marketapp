import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { buildInstagramAuthUrl, getInstagramCredentials } from '@/lib/server/instagram';

export const dynamic = 'force-dynamic';

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

/**
 * GET /api/auth/instagram/authorize
 *
 * Initiates Instagram OAuth for authenticated creators.
 * Encodes the creator's user ID and return destination into the OAuth state.
 */
export async function GET(request: Request) {
  const origin = getOrigin(request);
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/auth/onboarding/creator';

  try {
    // 1. Verify credentials exist
    const { appId } = getInstagramCredentials();
    if (!appId) {
      return NextResponse.redirect(
        `${origin}${returnTo}?ig_error=${encodeURIComponent(
          'Instagram integration is not yet configured on this environment (missing INSTAGRAM_APP_ID).'
        )}`
      );
    }

    // 2. Authenticate the caller
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      // Must be logged in via Google/Supabase first
      return NextResponse.redirect(
        `${origin}/auth/login?returnTo=${encodeURIComponent(
          `/api/auth/instagram/authorize?returnTo=${encodeURIComponent(returnTo)}`
        )}&error=${encodeURIComponent('Please sign in before connecting Instagram.')}`
      );
    }

    // Protect OAuth route: Only authorized test account can initiate Instagram OAuth during review
    const ALLOWED_TESTER_EMAILS = ['khormasti104@gmail.com'];
    const userEmail = (user.email || '').toLowerCase().trim();
    if (!ALLOWED_TESTER_EMAILS.includes(userEmail)) {
      return NextResponse.redirect(
        `${origin}${returnTo}?ig_error=${encodeURIComponent(
          'Instagram verification is currently being finalized. Coming soon!'
        )}`
      );
    }

    // 3. Build state token (userId + returnTo + timestamp)
    const statePayload = {
      uid: user.id,
      ret: returnTo,
      ts: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    // 4. Construct Instagram OAuth authorization URL
    const authUrl = buildInstagramAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    console.error('Error starting Instagram OAuth:', err);
    const message = err instanceof Error ? err.message : 'Failed to initiate Instagram OAuth';
    return NextResponse.redirect(
      `${origin}${returnTo}?ig_error=${encodeURIComponent(message)}`
    );
  }
}
