import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerRuntimeSecret } from '@/lib/server/razorpay';

export const dynamic = 'force-dynamic';

/**
 * Meta Data Deletion Callback Endpoint
 * Required by Meta Developer Platform for Instagram Graph API and Facebook Login.
 *
 * Meta sends a POST request with a `signed_request` parameter when a user deletes the app from Facebook/Instagram settings.
 * Returns: { url: string, confirmation_code: string }
 */
export async function POST(request: Request) {
  try {
    let signedRequest: string | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      signedRequest = formData.get('signed_request') as string;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      signedRequest = body.signed_request;
    }

    const confirmationCode = `MMI-DEL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://marketapp.expeditionthe0.workers.dev';

    let instagramUserId: string | null = null;

    if (signedRequest) {
      try {
        const [encodedSig, payload] = signedRequest.split('.');
        const decodedPayload = JSON.parse(
          Buffer.from(payload, 'base64url').toString('utf8')
        );
        instagramUserId = decodedPayload.user_id || null;
      } catch (parseErr) {
        console.warn('[Meta Data Deletion] Could not parse signed_request:', parseErr);
      }
    }

    // If an Instagram user ID was identified, unlink and anonymize their Instagram connection
    if (instagramUserId) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient
          .from('creator_profiles')
          .update({
            instagram_connected: false,
            instagram_verified: false,
            instagram_access_token: null,
            instagram_profile_data: null,
            verification_status: 'unverified',
          })
          .eq('instagram_user_id', instagramUserId);
      } catch (dbErr) {
        console.error('[Meta Data Deletion] DB update error:', dbErr);
      }
    }

    const statusUrl = `${baseUrl}/delete-account?confirmation_code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (err: any) {
    console.error('[Meta Data Deletion] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to process Meta data deletion request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://marketapp.expeditionthe0.workers.dev';
  return NextResponse.redirect(`${baseUrl}/delete-account`);
}
