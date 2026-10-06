import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/server/auth/token';

/**
 * Optimistic route protection (Next.js 16 `proxy`, formerly middleware).
 * Only verifies the signed cookie — no data access. Authoritative checks
 * (role, membership) still happen in layouts, route handlers and actions.
 */

// /api/test/reset guards itself (dev only, or token-protected in production builds).
const PUBLIC_PATHS = ['/login', '/api/health', '/api/test/reset'];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const result = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (isPublic) {
    // Signed-in users don't need the login page.
    if (pathname === '/login' && result.status === 'valid') {
      return NextResponse.redirect(new URL('/', request.url)); // → default landing page
    }
    return NextResponse.next();
  }

  if (result.status === 'valid') return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: { message: result.status === 'expired' ? 'Your session has expired.' : 'Authentication required.', status: 401 } },
      { status: 401 },
    );
  }

  const url = new URL('/login', request.url);
  if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
  if (result.status === 'expired') url.searchParams.set('reason', 'expired');
  const response = NextResponse.redirect(url);
  if (result.status === 'expired') response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
};
