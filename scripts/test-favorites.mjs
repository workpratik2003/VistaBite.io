/**
 * Phase 1C Authorization, Sequence, and PostGIS Integration Tests
 *
 * Tests (Tasks 14-16):
 *   - User A/B isolation
 *   - Direct cross-user access is rejected
 *   - Cross-user reel attachment is rejected
 *   - save_sequence permanence after delete
 *   - save_sequence per-user isolation
 *   - PostGIS coordinate sync (via existing test-postgis-location-sync.mjs)
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env.local
 *   - Dev server running on http://localhost:3000
 *   - Users A and B registered/logged in (done by the test itself)
 *
 * Run:
 *   node scripts/test-favorites.mjs
 */

const BASE = 'http://localhost:3000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function register(name, email, password) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`register failed: ${JSON.stringify(body)}`);
  const cookie = res.headers.get('set-cookie');
  return { user: body.user, cookie };
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(body)}`);
  const cookie = res.headers.get('set-cookie');
  return { user: body.user, cookie };
}

function authHeaders(cookie) {
  return { Cookie: cookie, 'Content-Type': 'application/json' };
}

async function createSpot(cookie, data) {
  const res = await fetch(`${BASE}/api/favorites/spots`, {
    method: 'POST',
    headers: authHeaders(cookie),
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`createSpot failed [${res.status}]: ${JSON.stringify(body)}`);
  return body.spot;
}

async function getSpot(cookie, id) {
  const res = await fetch(`${BASE}/api/favorites/spots/${id}`, {
    headers: authHeaders(cookie),
  });
  return { status: res.status, body: await res.json() };
}

async function listSpots(cookie) {
  const res = await fetch(`${BASE}/api/favorites/spots`, {
    headers: authHeaders(cookie),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`listSpots failed: ${JSON.stringify(body)}`);
  return body.spots;
}

async function deleteSpot(cookie, id) {
  const res = await fetch(`${BASE}/api/favorites/spots/${id}`, {
    method: 'DELETE',
    headers: authHeaders(cookie),
  });
  return { status: res.status };
}

async function createReel(cookie, data) {
  const res = await fetch(`${BASE}/api/favorites/reels`, {
    method: 'POST',
    headers: authHeaders(cookie),
    body: JSON.stringify(data),
  });
  return { status: res.status, body: await res.json() };
}

// ─── Test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn()
    .then(() => { console.log(`  ✅ ${name}`); passed++; })
    .catch((err) => { console.error(`  ❌ ${name}\n     ${err.message}`); failed++; });
}

// ─── Main ────────────────────────────────────────────────────────────────────

const TS = Date.now();
const emailA = `test_a_${TS}@vistabite.test`;
const emailB = `test_b_${TS}@vistabite.test`;
const PASSWORD = 'Test1234!';

console.log('\n🔑 Setting up test users…');
let cookieA, cookieB, userA, userB;

try {
  ({ cookie: cookieA, user: userA } = await register('Test User A', emailA, PASSWORD));
  ({ cookie: cookieB, user: userB } = await register('Test User B', emailB, PASSWORD));
} catch (e) {
  console.error('❌ Could not register test users:', e.message);
  console.error('   Is DATABASE_URL configured and dev server running?');
  process.exit(1);
}

// ────────────────────────────────────────────────────────────────────────────
console.log('\n📋 Task 14 — Authorization / Isolation Tests');
// ────────────────────────────────────────────────────────────────────────────

let spotA1, spotA2, spotB1;

await test('User A can create spot #1', async () => {
  spotA1 = await createSpot(cookieA, { name: 'Kolhapuri Wada Misal', city: 'Pune' });
  if (spotA1.save_sequence !== 1) throw new Error(`Expected #1, got #${spotA1.save_sequence}`);
});

await test('User A can create spot #2', async () => {
  spotA2 = await createSpot(cookieA, { name: 'FC Road Café', city: 'Pune' });
  if (spotA2.save_sequence !== 2) throw new Error(`Expected #2, got #${spotA2.save_sequence}`);
});

await test('User B can create spot #1 (independent sequence)', async () => {
  spotB1 = await createSpot(cookieB, { name: 'Mumbai Vada Pav', city: 'Mumbai' });
  if (spotB1.save_sequence !== 1) throw new Error(`Expected #1, got #${spotB1.save_sequence}`);
});

await test('User A sees only their own spots', async () => {
  const spots = await listSpots(cookieA);
  if (spots.length !== 2) throw new Error(`Expected 2 spots, got ${spots.length}`);
  const ids = spots.map(s => s.id);
  if (ids.includes(spotB1.id)) throw new Error('User A can see User B spot — isolation failure!');
});

await test('User B sees only their own spots', async () => {
  const spots = await listSpots(cookieB);
  if (spots.length !== 1) throw new Error(`Expected 1 spot, got ${spots.length}`);
  if (spots[0].id !== spotB1.id) throw new Error('Unexpected spot in User B list');
});

await test('User B cannot access User A spot directly (returns 404)', async () => {
  const { status } = await getSpot(cookieB, spotA1.id);
  if (status !== 404) throw new Error(`Expected 404, got ${status}`);
});

await test('User A cannot access User B spot directly (returns 404)', async () => {
  const { status } = await getSpot(cookieA, spotB1.id);
  if (status !== 404) throw new Error(`Expected 404, got ${status}`);
});

await test('User B cannot attach a Reel to User A spot (returns 404)', async () => {
  const { status, body } = await createReel(cookieB, {
    saved_spot_id: spotA1.id,
    instagram_url: `https://www.instagram.com/reel/TESTXYZ_${TS}/`,
  });
  if (status !== 404) throw new Error(`Expected 404, got ${status}: ${JSON.stringify(body)}`);
});

// ────────────────────────────────────────────────────────────────────────────
console.log('\n📋 Task 15 — Sequence Tests');
// ────────────────────────────────────────────────────────────────────────────

await test('Spot list returns spots in save_sequence order (ASC)', async () => {
  const spots = await listSpots(cookieA);
  const seqs = spots.map(s => s.save_sequence);
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] <= seqs[i - 1]) throw new Error(`Spots not in ASC order: ${seqs.join(', ')}`);
  }
});

await test('Delete spot #2, sequences not renumbered', async () => {
  const { status } = await deleteSpot(cookieA, spotA2.id);
  if (status !== 200) throw new Error(`Delete returned ${status}`);

  const spots = await listSpots(cookieA);
  if (spots.length !== 1) throw new Error(`Expected 1 spot after delete, got ${spots.length}`);
  if (spots[0].save_sequence !== 1) throw new Error(`Expected spot #1 to remain, got #${spots[0].save_sequence}`);
});

await test('New spot after delete gets next highest sequence (#3), not reusing #2', async () => {
  const spotD = await createSpot(cookieA, { name: 'Spot D', city: 'Pune' });
  if (spotD.save_sequence !== 3) throw new Error(`Expected #3, got #${spotD.save_sequence}`);

  // Cleanup
  await deleteSpot(cookieA, spotD.id);
});

await test('User A and User B can both have #1 (sequences are per-user)', async () => {
  const spotsA = await listSpots(cookieA);
  const spotsB = await listSpots(cookieB);
  const hasA1 = spotsA.some(s => s.save_sequence === 1);
  const hasB1 = spotsB.some(s => s.save_sequence === 1);
  if (!hasA1) throw new Error('User A does not have a spot #1');
  if (!hasB1) throw new Error('User B does not have a spot #1');
});

await test('save_sequence is not accepted from client (stripped)', async () => {
  // Even if client sends save_sequence: 999, server ignores it
  const res = await fetch(`${BASE}/api/favorites/spots`, {
    method: 'POST',
    headers: authHeaders(cookieA),
    body: JSON.stringify({ name: 'Exploit Attempt', save_sequence: 999 }),
  });
  const body = await res.json();
  // Should return 400 (z.never() rejects the field)
  if (res.status !== 400) throw new Error(`Expected 400 (z.never rejects save_sequence), got ${res.status}: ${JSON.stringify(body)}`);
});

await test('Duplicate reel for same user returns 409', async () => {
  const url = `https://www.instagram.com/reel/DUPETEST_${TS}/`;
  const { status: s1 } = await createReel(cookieA, { saved_spot_id: spotA1.id, instagram_url: url });
  if (s1 !== 201) throw new Error(`First create returned ${s1}`);
  const { status: s2, body: b2 } = await createReel(cookieA, { saved_spot_id: spotA1.id, instagram_url: url });
  if (s2 !== 409) throw new Error(`Expected 409 for duplicate, got ${s2}: ${JSON.stringify(b2)}`);
});

console.log('\n📋 Concurrency Test');

await test('Concurrent spot creations are assigned distinct sequences (N and N+1)', async () => {
  // We fire two createSpot requests simultaneously without awaiting the first one
  const req1 = fetch(`${BASE}/api/favorites/spots`, {
    method: 'POST',
    headers: authHeaders(cookieA),
    body: JSON.stringify({ name: 'Concurrent Spot 1', city: 'TestCity' })
  });
  const req2 = fetch(`${BASE}/api/favorites/spots`, {
    method: 'POST',
    headers: authHeaders(cookieA),
    body: JSON.stringify({ name: 'Concurrent Spot 2', city: 'TestCity' })
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  
  const body1 = await res1.json();
  const body2 = await res2.json();

  if (!res1.ok) throw new Error(`Concurrent req1 failed: ${JSON.stringify(body1)}`);
  if (!res2.ok) throw new Error(`Concurrent req2 failed: ${JSON.stringify(body2)}`);

  const seq1 = body1.spot.save_sequence;
  const seq2 = body2.spot.save_sequence;

  if (seq1 === seq2) {
    throw new Error(`Race condition detected: both spots got sequence ${seq1}`);
  }
  
  if (Math.abs(seq1 - seq2) !== 1) {
    throw new Error(`Sequences not consecutive: ${seq1} and ${seq2}`);
  }
});

// ────────────────────────────────────────────────────────────────────────────
console.log('\n📋 Task 16 — PostGIS Coordinate Sync');
// ────────────────────────────────────────────────────────────────────────────

await test('Creating spot with lat/lon stores coordinates', async () => {
  const spot = await createSpot(cookieA, {
    name: 'Coord Test Spot',
    latitude: 18.5204,
    longitude: 73.8567,
  });
  if (spot.latitude === null) throw new Error('latitude is null after create');
  if (spot.longitude === null) throw new Error('longitude is null after create');
  if (Math.abs(Number(spot.latitude) - 18.5204) > 0.0001) throw new Error('latitude mismatch');
  if (Math.abs(Number(spot.longitude) - 73.8567) > 0.0001) throw new Error('longitude mismatch');
  await deleteSpot(cookieA, spot.id);
});

await test('Creating spot without coordinates stores null lat/lon', async () => {
  const spot = await createSpot(cookieA, { name: 'No Coord Spot' });
  if (spot.latitude !== null) throw new Error(`Expected null lat, got ${spot.latitude}`);
  if (spot.longitude !== null) throw new Error(`Expected null lon, got ${spot.longitude}`);
  await deleteSpot(cookieA, spot.id);
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(55)}`);
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
console.log('─'.repeat(55));

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\n✅ All Phase 1C integration tests passed.');
}
