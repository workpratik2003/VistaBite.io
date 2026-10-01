/**
 * VistaBite V2 Server-Side Authorization Helper
 *
 * This is the single, authoritative method for verifying authenticated
 * users on protected API routes. Every protected API must use this helper
 * instead of implementing its own session logic.
 *
 * The session is verified server-side using the real session token from the
 * cookie + DB lookup. The client cannot inject a user_id.
 */

import { NextResponse } from 'next/server';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Extract the authenticated user from the request.
 * Reads the session cookie, verifies it against the database, and returns the user.
 *
 * @returns AuthenticatedUser if valid session exists
 * @throws {NextResponse} 401 response if not authenticated
 *
 * Usage in route handler:
 *   const user = await requireUser(request);
 */
export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies[getSessionCookieName()];

  if (!token) {
    throw NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await getSessionUser(token);

  if (!user) {
    throw NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

/**
 * Attempt to get the authenticated user without throwing.
 * Returns null if not authenticated.
 * Useful for routes like /api/auth/me.
 */
export async function getOptionalUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const token = cookies[getSessionCookieName()];

    if (!token) return null;

    const user = await getSessionUser(token);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}
