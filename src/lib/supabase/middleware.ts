import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const PROTECTED_PREFIXES = [
  '/dashboard/business',
  '/dashboard/creator',
  '/orders',
  '/admin',
  '/auth/role-select',
  '/auth/onboarding/business',
  '/auth/onboarding/creator',
];

const AUTH_ONLY_ROUTES = [
  '/auth/login',
  '/auth/signup',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => pathname === route);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('your-project')
  ) {
    return NextResponse.next({ request });
  }

  // Fast-path: Check whether Supabase session cookies exist
  const hasAuthCookies = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  // If unauthenticated user requests a protected route without any session cookies:
  if (!hasAuthCookies) {
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // On public routes without auth cookies, avoid expensive Supabase getUser() calls
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Authenticate session and trigger refresh token rotation if expired
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If user session is invalid / expired / revoked
  if (authError || !user) {
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Forward any cookie removals (cleared session) so client drops stale cookies
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    return supabaseResponse;
  }

  // If user is already authenticated and visits /auth/login or /auth/signup
  if (isAuthOnlyPath(pathname)) {
    const destinationUrl = new URL('/', request.url);
    const redirectResponse = NextResponse.redirect(destinationUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

