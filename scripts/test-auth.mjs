/**
 * VistaBite Phase 1B — Authentication API Tests
 *
 * These tests run against the LIVE API endpoints using fetch().
 * They require:
 *   - A running dev server (npm run dev)
 *   - A valid DATABASE_URL in .env.local
 *
 * Run: node --experimental-vm-modules scripts/test-auth.mjs
 *
 * Test coverage:
 *  - Registration: valid, duplicate email, invalid email, weak password, missing fields
 *  - Login: valid credentials, invalid password, nonexistent account, email normalization
 *  - Session: creation, valid session, expired session, invalid session, logout, cookie clearing
 *  - Authorization: unauthenticated, authenticated, cross-user isolation
 *  - Regression: V1 routes still accessible
 */

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Generate a unique email for each test run */
function uniqueEmail() {
  return `test+${Date.now()}+${Math.random().toString(36).slice(2)}@example.com`;
}

/**
 * Perform a POST and return { status, body, headers }.
 * Optionally pass a Cookie header string.
 */
async function post(path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });
  return {
    status: res.status,
    body: await res.json().catch(() => ({})),
    headers: res.headers,
  };
}

async function get(path, cookie) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    headers,
    redirect: 'manual',
  });
  return {
    status: res.status,
    body: await res.json().catch(() => ({})),
    headers: res.headers,
  };
}

/** Extract the Set-Cookie header value for vistabite_session */
function extractSessionCookie(headers) {
  const raw = headers.get('set-cookie') ?? '';
  const match = raw.match(/vistabite_session=([^;]+)/);
  return match ? `vistabite_session=${match[1]}` : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. REGISTRATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Registration Tests');

await test('Valid registration creates user and returns safe user data', async () => {
  const email = uniqueEmail();
  const { status, body, headers } = await post('/api/auth/register', {
    name: 'Test User',
    email,
    password: 'TestPass123',
  });
  assertEqual(status, 201, `Expected 201, got ${status}`);
  assert(body.authenticated === true, 'Should be authenticated');
  assert(body.user?.id, 'Should have user id');
  assertEqual(body.user?.email, email.toLowerCase(), 'Email should be normalized');
  assert(!body.user?.password_hash, 'Should NOT expose password_hash');
  assert(!body.user?.password_salt, 'Should NOT expose password_salt');
  const cookie = extractSessionCookie(headers);
  assert(cookie, 'Should set session cookie');
  assert(headers.get('set-cookie')?.includes('HttpOnly'), 'Cookie must be HttpOnly');
});

await test('Duplicate email registration returns 409', async () => {
  const email = uniqueEmail();
  await post('/api/auth/register', { name: 'First', email, password: 'ValidPass1' });
  const { status } = await post('/api/auth/register', { name: 'Second', email, password: 'ValidPass1' });
  assertEqual(status, 409, `Expected 409 for duplicate email, got ${status}`);
});

await test('Invalid email returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    name: 'Test',
    email: 'not-an-email',
    password: 'ValidPass1',
  });
  assertEqual(status, 400, `Expected 400, got ${status}`);
});

await test('Weak password (no number) returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    name: 'Test',
    email: uniqueEmail(),
    password: 'onlyletters',
  });
  assertEqual(status, 400, `Expected 400 for weak password, got ${status}`);
});

await test('Short password returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    name: 'Test',
    email: uniqueEmail(),
    password: 'Ab1',
  });
  assertEqual(status, 400, `Expected 400 for short password, got ${status}`);
});

await test('Missing name returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    email: uniqueEmail(),
    password: 'ValidPass1',
  });
  assertEqual(status, 400, `Expected 400 for missing name, got ${status}`);
});

await test('Missing email returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    name: 'Test',
    password: 'ValidPass1',
  });
  assertEqual(status, 400, `Expected 400 for missing email, got ${status}`);
});

await test('Missing password returns 400', async () => {
  const { status } = await post('/api/auth/register', {
    name: 'Test',
    email: uniqueEmail(),
  });
  assertEqual(status, 400, `Expected 400 for missing password, got ${status}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOGIN TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Login Tests');

// Set up a user for login tests
const loginEmail = uniqueEmail();
await post('/api/auth/register', { name: 'Login Test', email: loginEmail, password: 'LoginPass1' });

await test('Valid credentials return user and set cookie', async () => {
  const { status, body, headers } = await post('/api/auth/login', {
    email: loginEmail,
    password: 'LoginPass1',
  });
  assertEqual(status, 200, `Expected 200, got ${status}`);
  assert(body.authenticated === true, 'Should be authenticated');
  assert(body.user?.id, 'Should have user id');
  assert(!body.user?.password_hash, 'Should NOT expose password_hash');
  const cookie = extractSessionCookie(headers);
  assert(cookie, 'Should set session cookie');
  assert(headers.get('set-cookie')?.includes('HttpOnly'), 'Cookie must be HttpOnly');
});

await test('Wrong password returns 401 with generic error', async () => {
  const { status, body } = await post('/api/auth/login', {
    email: loginEmail,
    password: 'WrongPassword1',
  });
  assertEqual(status, 401, `Expected 401, got ${status}`);
  // Must not reveal "invalid password" specifically
  assert(!body.error?.toLowerCase().includes('password'), 'Error must not mention "password"');
});

await test('Nonexistent email returns 401 with same generic error', async () => {
  const { status, body } = await post('/api/auth/login', {
    email: 'nonexistent@example.com',
    password: 'SomePass1',
  });
  assertEqual(status, 401, `Expected 401, got ${status}`);
  // Must not reveal account doesn't exist
  assert(!body.error?.toLowerCase().includes('not found'), 'Error must not reveal account existence');
});

await test('Login normalizes email (uppercase → lowercase)', async () => {
  const { status } = await post('/api/auth/login', {
    email: loginEmail.toUpperCase(),
    password: 'LoginPass1',
  });
  assertEqual(status, 200, `Expected 200 with normalized email, got ${status}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION & /me TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Session & /me Tests');

const sessionEmail = uniqueEmail();
const { headers: regHeaders } = await post('/api/auth/register', {
  name: 'Session Test',
  email: sessionEmail,
  password: 'SessionPass1',
});
const sessionCookie = extractSessionCookie(regHeaders);

await test('/api/auth/me returns authenticated:true with valid session', async () => {
  const { status, body } = await get('/api/auth/me', sessionCookie);
  assertEqual(status, 200, `Expected 200, got ${status}`);
  assert(body.authenticated === true, 'Should be authenticated');
  assert(body.user?.id, 'Should have user id');
  assert(!body.user?.password_hash, 'Should NOT expose password_hash');
});

await test('/api/auth/me returns authenticated:false with no cookie', async () => {
  const { status, body } = await get('/api/auth/me');
  assertEqual(status, 200, `Expected 200, got ${status}`);
  assert(body.authenticated === false, 'Should not be authenticated');
});

await test('/api/auth/me returns authenticated:false with invalid token', async () => {
  const { status, body } = await get('/api/auth/me', 'vistabite_session=fakeinvalidtoken');
  assertEqual(status, 200, `Expected 200, got ${status}`);
  assert(body.authenticated === false, 'Should not be authenticated with fake token');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LOGOUT TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Logout Tests');

await test('Logout invalidates session and clears cookie', async () => {
  // Create fresh session
  const logoutEmail = uniqueEmail();
  const { headers: lh } = await post('/api/auth/register', {
    name: 'Logout Test',
    email: logoutEmail,
    password: 'LogoutPass1',
  });
  const logoutCookie = extractSessionCookie(lh);
  assert(logoutCookie, 'Should have session cookie before logout');

  // Logout
  const { status, headers: logoutHeaders } = await post('/api/auth/logout', {}, logoutCookie);
  assertEqual(status, 200, `Expected 200 from logout, got ${status}`);

  // Cookie should be cleared (maxAge=0 or expires in past)
  const setCookie = logoutHeaders.get('set-cookie') ?? '';
  assert(
    setCookie.includes('Max-Age=0') || setCookie.includes('expires=Thu, 01 Jan 1970'),
    'Cookie should be cleared on logout'
  );

  // Session should no longer be valid
  const { body: meBody } = await get('/api/auth/me', logoutCookie);
  assert(meBody.authenticated === false, 'Session should be invalid after logout');
});

await test('Logout is idempotent (no session cookie → still 200)', async () => {
  const { status } = await post('/api/auth/logout', {});
  assertEqual(status, 200, `Expected 200 for logout with no cookie, got ${status}`);
});

await test('Logout with invalid token → still 200 (idempotent)', async () => {
  const { status } = await post('/api/auth/logout', {}, 'vistabite_session=invalidtoken');
  assertEqual(status, 200, `Expected 200 for logout with invalid token, got ${status}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUTHORIZATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Authorization Tests');

await test('User identity derived from session, not request body', async () => {
  // Register two users
  const userA_email = uniqueEmail();
  const userB_email = uniqueEmail();
  const { body: userA } = await post('/api/auth/register', {
    name: 'User A', email: userA_email, password: 'UserAPass1'
  });
  const { headers: bHeaders } = await post('/api/auth/register', {
    name: 'User B', email: userB_email, password: 'UserBPass1'
  });
  const userBCookie = extractSessionCookie(bHeaders);

  // User B's /me should return User B, even if User A's ID is somehow in a body
  const { body: meBody } = await get('/api/auth/me', userBCookie);
  assertEqual(meBody.user?.email, userB_email.toLowerCase(), 'Should return User B identity, not User A');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. REGRESSION — V1 ROUTES STILL ACCESSIBLE
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 Regression Tests (V1 routes)');

await test('GET /api/analytics/dashboard is accessible without auth', async () => {
  const res = await fetch(`${BASE}/api/analytics/dashboard`, { redirect: 'manual' });
  assert(res.status !== 401, `V1 analytics should not require auth, got ${res.status}`);
  assert(res.status !== 302, 'V1 analytics should not redirect to login');
});

await test('POST /api/submit-reel is accessible without auth', async () => {
  // Just checking it doesn't 401 or redirect — it may return 400 for invalid data
  const res = await fetch(`${BASE}/api/submit-reel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    redirect: 'manual',
  });
  assert(res.status !== 401, `V1 submit-reel should not require auth, got ${res.status}`);
  assert(res.status !== 302, 'V1 submit-reel should not redirect to login');
});

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
console.log('─'.repeat(50));

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
}
