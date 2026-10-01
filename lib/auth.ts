/**
 * VistaBite V2 Authentication Utilities
 * Minimal, secure authentication using Node's built-in crypto.
 * No external dependencies.
 */

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';

const SESSION_COOKIE_NAME = 'vistabite_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Get the session secret from environment.
 * In production, SESSION_SECRET MUST be set.
 * In development, falls back to a deterministic but insecure value.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    // Dev-only fallback - NOT secure, only for local development
    return 'dev-insecure-secret-do-not-use-in-production';
  }
  return secret;
}

/**
 * Hash a password using scrypt (built-in KDF).
 * Returns: salt:hash (both hex)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const computedHash = scryptSync(password, salt, 64).toString('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Create a session token (random bytes).
 * The token is stored hashed in the database.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a session token for storage.
 * Uses HMAC-SHA256 with the session secret.
 */
export function hashSessionToken(token: string): string {
  return createHmac('sha256', getSessionSecret()).update(token).digest('hex');
}

/**
 * Verify a session token against its hash.
 */
export function verifySessionToken(token: string, tokenHash: string): boolean {
  const expectedHash = hashSessionToken(token);
  try {
    return timingSafeEqual(Buffer.from(tokenHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Get the session cookie name.
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Get the session max age in seconds.
 */
export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}

/**
 * Parse cookies from a cookie header string.
 * Returns object with cookie name -> value.
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const cookie of cookieHeader.split(';')) {
    const [name, ...valueParts] = cookie.split('=');
    if (name && valueParts.length > 0) {
      cookies[name.trim()] = decodeURIComponent(valueParts.join('='));
    }
  }
  return cookies;
}

/**
 * Create a session cookie options object for Next.js Response.
 */
export function createSessionCookieOptions(): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    maxAge: number;
    path: string;
  };
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: '', // Will be set by caller
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    },
  };
}

/**
 * Create a cleared (expired) session cookie for logout.
 */
export function createClearedSessionCookie(): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    maxAge: number;
    path: string;
  };
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    },
  };
}