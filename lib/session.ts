/**
 * VistaBite V2 Session Management
 * DB-backed session creation, verification, and deletion.
 */

import { pool } from '@/lib/db';
import { hashSessionToken, verifySessionToken, generateSessionToken, getSessionMaxAge } from '@/lib/auth';

/**
 * Create a new session for a user.
 * Returns the raw token (to set as cookie) and the user record.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + getSessionMaxAge() * 1000);

  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt.toISOString()]
  );

  return token;
}

/**
 * Look up a session by token and return the user if valid.
 * Returns null if the session is invalid or expired.
 */
export async function getSessionUser(token: string): Promise<{ id: string; email: string; name: string | null } | null> {
  const tokenHash = hashSessionToken(token);

  const result = await pool.query(
    `SELECT u.id, u.email, u.name
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
  };
}

/**
 * Delete a session by token (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);

  await pool.query(
    'DELETE FROM sessions WHERE token_hash = $1',
    [tokenHash]
  );
}

/**
 * Delete expired sessions (cleanup helper, not currently called automatically).
 */
export async function deleteExpiredSessions(): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
}
