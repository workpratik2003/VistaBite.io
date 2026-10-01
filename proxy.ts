/**
 * VistaBite Next.js Middleware
 *
 * RESPONSIBILITY: Lightweight navigation guard only.
 *  - Checks if session cookie EXISTS (presence check only — no crypto, no DB).
 *  - Redirects unauthenticated users away from protected page routes.
 *  - Never substitutes for server-side requireUser() authorization.
 *
 * WHY NO CRYPTO HERE:
 *  Next.js Middleware runs on the Edge runtime by default. Node's built-in
 *  crypto module is not available in the Edge runtime. All real session
 *  verification (HMAC, DB lookup, expiry) happens inside requireUser() in
 *  Node.js API route handlers.
 *
 * PROTECTED ROUTES (navigation redirect):
 *  - /favorites, /favorites/[id]
 *  - /add-reel
 *
 * PUBLIC ROUTES (always allowed through):
 *  - /              (home)
 *  - /login
 *  - /register
 *  - /api/auth/*    (all auth APIs)
 *  - /api/*         (V1 APIs, they handle their own auth)
 *  - /admin
 *  - /api-test
 *  - /_next, /favicon.ico (Next.js internals)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'vistabite_session'

/**
 * Protected page routes that require a session cookie to be present.
 * If the cookie is absent, redirect to /login.
 * API routes (/api/*) are NOT redirected here — they return 401 via requireUser().
 */
const PROTECTED_PAGE_PREFIXES = [
  '/favorites',
  '/add-reel',
]

/**
 * Routes that logged-in users should not see (redirect to home if authenticated).
 */
const AUTH_ONLY_PAGES = ['/login', '/register']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME)

  // Protected pages: no session → redirect to login
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isProtectedPage && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth-only pages: already has session → redirect to home
  // (Avoid showing login/register to already-authenticated users)
  if (AUTH_ONLY_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
