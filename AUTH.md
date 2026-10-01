# VistaBite Phase 1B — Authentication & Session Documentation

## Overview

This document describes the authentication architecture implemented in Phase 1B.
It covers session flow, cookie strategy, route protection, environment variables,
and known limitations.

---

## Authentication Flow

```
REGISTRATION
────────────
Client → POST /api/auth/register { name, email, password }
         Zod validation → normalize email → check duplicate
         hashPassword(password) using scrypt (Node crypto)
         INSERT INTO users (email, name, password_hash)
         createSession(userId) → random 32-byte token
         HMAC-SHA256 token → token_hash stored in sessions table
         Set-Cookie: vistabite_session=<raw_token>; HttpOnly; SameSite=Lax; ...
         Return { authenticated: true, user: { id, email, name } }

LOGIN
─────
Client → POST /api/auth/login { email, password }
         Normalize email → SELECT password_hash FROM users WHERE email = $1
         verifyPassword(password, hash) using scrypt + timingSafeEqual
         On failure → 401 "Invalid login attempt" (generic)
         On success → createSession(userId) → Set-Cookie → Return user

LOGOUT
──────
Client → POST /api/auth/logout
         Read session cookie → HMAC → DELETE FROM sessions WHERE token_hash = $1
         Set-Cookie: vistabite_session=; Max-Age=0 (clear cookie)
         200 OK (idempotent — safe even if already logged out)
```

---

## Cookie Security Settings

| Setting    | Value                                          |
|------------|------------------------------------------------|
| Name       | `vistabite_session`                            |
| HttpOnly   | `true` — inaccessible to JavaScript            |
| SameSite   | `Lax` — safe for navigation, blocks CSRF       |
| Secure     | `true` in production, `false` in development   |
| Path       | `/`                                            |
| Max-Age    | `2592000` (30 days in seconds)                 |

The token is **never** stored in localStorage, sessionStorage, or React state,
exposed to client-side JavaScript, passed in URL parameters, or returned in API response bodies.

- Protected API routes **must** perform server-side authorization.
- User identity comes **only** from the server-side session.
- Client-supplied `user_id` must **never** be trusted for authorization.

---

## Public Routes

| Route                   | Notes                            |
|-------------------------|----------------------------------|
| `/`                     | Home (V1)                        |
| `/login`                | Login page                       |
| `/register`             | Register page                    |
| `/api/auth/register`    | Registration API                 |
| `/api/auth/login`       | Login API                        |
| `/api/auth/me`          | Auth state check                 |
| `/api/auth/logout`      | Logout (idempotent)              |
| `/api/search-reels`     | V1 search                        |
| `/api/search-reels-db`  | V1 DB search                     |
| `/api/submit-reel`      | V1 submit reel                   |
| `/api/analytics/*`      | V1 analytics                     |

---

## Protected Routes

| Route              | Protection                                           |
|--------------------|------------------------------------------------------|
| `/favorites`       | Proxy (cookie presence) + server-side verify         |
| `/favorites/[id]`  | Proxy (cookie presence) + server-side verify         |
| `/add-reel`        | Proxy (cookie presence) + server-side verify         |
| `/api/favorites/*` | `requireUser()` server-side (Phase 2)                |
| `/api/reels/*`     | `requireUser()` server-side (Phase 2)                |

---

## Proxy Responsibility (`proxy.ts`)

**Location:** `/proxy.ts` (project root)
**Runtime:** Edge (no Node.js crypto)

What it does:
- Lightweight navigation protection based on session-cookie presence only (no HMAC, no DB).
- Protected page + no cookie → redirect to `/login?redirect=<path>`
- `/login` or `/register` + cookie present → redirect to `/` (already logged in)
- All other routes → pass through

**Actual authentication/authorization happens server-side using `lib/requireUser.ts`** and session verification inside API route handlers and Server Components.

---

## Server-Side Authorization (`lib/requireUser.ts`)

```typescript
const user = await requireUser(request);
// identity is from the session, never from request body
```

Flow: read cookie → HMAC → DB lookup (sessions JOIN users WHERE expires_at > NOW()) → return user or throw 401.

---

## Environment Variables

| Variable         | Required              | Description                            |
|------------------|-----------------------|----------------------------------------|
| `DATABASE_URL`   | Yes                   | PostgreSQL (Neon) connection string    |
| `SESSION_SECRET` | Yes in production     | HMAC secret, min 32 random bytes       |

```bash
# Generate:
openssl rand -hex 32
```

---

## Known Limitations

1. **No rate limiting** — add Cloudflare/Vercel Edge rate limiting for production.
2. **Expired sessions accumulate** — `deleteExpiredSessions()` exists but needs a cron job.
3. **Single-device logout only** — does not invalidate other active sessions.
4. **No account lockout** — failed login attempts are not tracked.
5. **SESSION_SECRET rotation** invalidates all existing sessions (no key versioning).
6. **Secure=false in development** — do not make prod security assumptions in dev.

---

## Running Tests

```bash
# Start dev server first, then:
npm run test:auth
```

Coverage: registration (valid/duplicate/invalid/weak), login (valid/wrong/nonexistent/normalization),
session (/me authenticated/unauthenticated/invalid), logout (invalidation/idempotent),
authorization (identity from session), V1 regression.
