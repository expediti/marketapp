import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');

  // If an OAuth authorization code arrives at root or another page, route to /auth/callback
  if (code && url.pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', request.url);
    url.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  return await updateSession(request);
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static image/video/font assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
