import { NextRequest, NextResponse } from 'next/server';

// ─── Route → Required Atom Map ────────────────────────────────────────────────
// Maps pathname prefixes to the permission atom needed. More-specific routes
// should come first.

const ROUTE_PERMISSION_MAP: Array<{ pattern: RegExp; atom: string }> = [
  // Users
  { pattern: /^\/dashboard\/users/, atom: 'users:read' },
  // Permissions management
  { pattern: /^\/dashboard\/permissions/, atom: 'permissions:read' },
  // Leads
  { pattern: /^\/dashboard\/leads/, atom: 'leads:view' },
  // Reports
  { pattern: /^\/dashboard\/reports/, atom: 'reports:view' },
  // Audit
  { pattern: /^\/dashboard\/audit/, atom: 'audit:read' },
  // System settings
  { pattern: /^\/dashboard\/settings/, atom: 'settings:manage' },
  // Tasks – available to all authenticated users
  { pattern: /^\/dashboard\/tasks/, atom: '' },
  // Root dashboard – any authenticated user
  { pattern: /^\/dashboard$/, atom: '' },
];

// ─── JWT Claim Decoder (Edge-safe, no crypto needed for payload decode) ───────

interface ClaimsPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  exp?: number;
}

function decodeJwtPayload(token: string): ClaimsPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64URL → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const payload = JSON.parse(json) as ClaimsPayload;

    // Check token expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Proxy (formerly Middleware) ─────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Only guard /dashboard and /portal routes
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  // Read the access token from the short-lived readable cookie set by the frontend
  const accessToken = request.cookies.get('access-token')?.value;
  // Long-lived session marker that persists for the full refresh-token lifetime (7 days).
  // If present without a valid access-token, the client-side refresh will renew the session.
  const authSession = request.cookies.get('auth_session')?.value;

  if (!accessToken && !authSession) {
    // Neither cookie present — definitely not logged in
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!accessToken || !decodeJwtPayload(accessToken)) {
    // Access token is missing or expired, but auth_session exists.
    // Let the request through — the client-side useEffect will call /auth/refresh
    // to obtain a fresh token without forcing an unnecessary redirect to /login.
    if (authSession) return NextResponse.next();

    // No session marker either — redirect to login and clean up stale cookie
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('access-token');
    return response;
  }

  const claims = decodeJwtPayload(accessToken)!;

  // Find the most specific matching route rule (dashboard routes only)
  if (pathname.startsWith('/dashboard')) {
    const matchedRule = ROUTE_PERMISSION_MAP.find(({ pattern }) =>
      pattern.test(pathname),
    );

    if (matchedRule && matchedRule.atom) {
      const hasPermission = claims.permissions?.includes(matchedRule.atom) ?? false;
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }
  // Portal is accessible to all authenticated users (no atom required)

  // Attach decoded claims as request headers for Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', claims.sub);
  requestHeaders.set('x-user-role', claims.role);
  requestHeaders.set('x-user-permissions', claims.permissions.join(','));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/portal'],
};
