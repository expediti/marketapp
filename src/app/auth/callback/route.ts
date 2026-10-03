import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `https://${host}`;
  }

  return requestUrl.origin;
}

export async function GET(request: Request) {
  const origin = getOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

    // Check role from query param or fallback cookie intent
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieRoleMatch = cookieHeader.match(/marketur_role_intent=(creator|business|influencer|owner|advertiser)/i);
    const cookieRole = cookieRoleMatch ? cookieRoleMatch[1] : null;
    const rawRequestedRole = searchParams.get('role') || cookieRole;

    const requestedRole =
      rawRequestedRole && (rawRequestedRole.toLowerCase() === 'creator' || rawRequestedRole.toLowerCase() === 'influencer')
        ? 'creator'
        : rawRequestedRole && (rawRequestedRole.toLowerCase() === 'business' || rawRequestedRole.toLowerCase() === 'owner' || rawRequestedRole.toLowerCase() === 'advertiser')
        ? 'business'
        : null;

    // 1. Handle OAuth provider errors or cancellations
    if (error) {
      const errorMsg = errorDescription || error;
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(errorMsg)}`
      );
    }

    // 2. Authorization code exchange
    if (code) {
      try {
        const supabase = await createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
          );
        }

        // 3. Obtain the authenticated Supabase user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent('Failed to retrieve authenticated user session')}`
          );
        }

        // 4. Check whether a profiles row exists for auth.users.id
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role, display_name, email, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        let activeRole = existingProfile?.role || null;

        // 5. If it does not exist, create it idempotently
        if (!existingProfile) {
          const metadata = user.user_metadata || {};
          const displayName =
            metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            (user.email ? user.email.split('@')[0] : 'User');
          const avatarUrl = metadata.avatar_url || metadata.picture || null;

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email: user.email || '',
                display_name: displayName,
                avatar_url: avatarUrl,
                role: requestedRole,
              },
              { onConflict: 'id' }
            )
            .select('id, role')
            .single();

          if (!insertError && newProfile) {
            activeRole = newProfile.role;
          } else if (insertError) {
            console.error('Profile creation error during callback:', insertError);
          }
        } else if (!existingProfile.role && requestedRole) {
          // If profile exists but has no role yet, apply user's requested role
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: requestedRole })
            .eq('id', user.id)
            .select('id, role')
            .single();

          if (!updateError && updatedProfile) {
            activeRole = updatedProfile.role;
          }
        }

        // 6 & 7. Determine whether role is already selected and route accordingly
        let destination = `${origin}/auth/role-select`;

        if (activeRole) {
          const normalizedRole = activeRole.toLowerCase();

          if (normalizedRole === 'creator' || normalizedRole === 'influencer') {
            const { data: creatorProfile } = await supabase
              .from('creator_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .maybeSingle();

            destination = creatorProfile
              ? `${origin}/dashboard/creator`
              : `${origin}/auth/onboarding/creator`;
          } else if (
            normalizedRole === 'business' ||
            normalizedRole === 'advertiser' ||
            normalizedRole === 'owner'
          ) {
            const { data: businessProfile } = await supabase
              .from('business_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .maybeSingle();

            destination = businessProfile
              ? `${origin}/dashboard/business`
              : `${origin}/auth/onboarding/business`;
          } else if (normalizedRole === 'admin') {
            destination = `${origin}/dashboard/business`;
          }
        }

        const redirectResponse = NextResponse.redirect(destination);
        redirectResponse.cookies.set('marketur_role_intent', '', { maxAge: 0, path: '/' });
        return redirectResponse;
      } catch (err: unknown) {
        console.error('Unexpected error in auth callback:', err);
        const message = err instanceof Error ? err.message : 'Authentication callback failed';
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(message)}`
        );
      }
    }

    // Missing code
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('No authorization code provided by OAuth provider')}`
    );
  }
