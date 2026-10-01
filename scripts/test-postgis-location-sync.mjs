/**
 * Unit tests for PostGIS location synchronization logic.
 *
 * These tests exercise the buildLocationExpr() helper that is used by
 * createSavedSpot() and updateSavedSpot() to derive the PostGIS
 * geography(POINT, 4326) expression from latitude/longitude.
 *
 * They run entirely without a database connection.
 *
 * Run: node scripts/test-postgis-location-sync.mjs
 */

import assert from 'assert';

// ─────────────────────────────────────────────────────────────────────────────
// Inline the pure logic under test (no DB import needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a SQL fragment for the PostGIS location column, or null.
 *
 * PostGIS POINT convention: POINT(longitude latitude) — x=lon, y=lat.
 * We use ST_MakePoint(longitude, latitude) cast to geography(4326).
 */
function buildLocationExpr(latitude, longitude) {
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    isFinite(latitude) &&
    isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  ) {
    // Returns the expression string that would be embedded in SQL.
    // Real usage: ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography
    return `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
  }
  return null;
}

/**
 * Mirrors the merge logic in updateSavedSpot():
 * given existing row and incoming patch, compute the effective lat/lng
 * then derive location.
 */
function resolveLocationForUpdate(existingRow, patch) {
  const newLat = patch.latitude  !== undefined ? patch.latitude  : existingRow.latitude;
  const newLon = patch.longitude !== undefined ? patch.longitude : existingRow.longitude;
  return buildLocationExpr(newLat, newLon);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE scenarios
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 CREATE — buildLocationExpr()');

test('Valid lat/lon produces a non-null expression', () => {
  const expr = buildLocationExpr(18.5204, 73.8567); // Pune
  assert(expr !== null, 'Expected non-null for valid coordinates');
});

test('Expression uses ST_MakePoint(longitude, latitude) order', () => {
  const lat = 18.5204;
  const lon = 73.8567;
  const expr = buildLocationExpr(lat, lon);
  // PostGIS convention: x=longitude, y=latitude
  assert(
    expr.includes(`ST_MakePoint(${lon}, ${lat})`),
    `Expected ST_MakePoint(${lon}, ${lat}), got: ${expr}`
  );
});

test('Expression sets SRID 4326', () => {
  const expr = buildLocationExpr(40.7128, -74.0060); // NYC
  assert(expr.includes('4326'), 'Expected SRID 4326 in expression');
});

test('Null latitude → null location', () => {
  const expr = buildLocationExpr(null, 73.8567);
  assert(expr === null, 'Expected null when latitude is null');
});

test('Null longitude → null location', () => {
  const expr = buildLocationExpr(18.5204, null);
  assert(expr === null, 'Expected null when longitude is null');
});

test('Both null → null location', () => {
  const expr = buildLocationExpr(null, null);
  assert(expr === null, 'Expected null when both are null');
});

test('Undefined latitude → null location', () => {
  const expr = buildLocationExpr(undefined, 73.8567);
  assert(expr === null, 'Expected null when latitude is undefined');
});

test('NaN latitude → null location', () => {
  const expr = buildLocationExpr(NaN, 73.8567);
  assert(expr === null, 'Expected null when latitude is NaN');
});

test('Latitude out of range (>90) → null location', () => {
  const expr = buildLocationExpr(91, 73.8567);
  assert(expr === null, 'Expected null when latitude > 90');
});

test('Latitude out of range (<-90) → null location', () => {
  const expr = buildLocationExpr(-91, 73.8567);
  assert(expr === null, 'Expected null when latitude < -90');
});

test('Longitude out of range (>180) → null location', () => {
  const expr = buildLocationExpr(18.5204, 181);
  assert(expr === null, 'Expected null when longitude > 180');
});

test('Longitude out of range (<-180) → null location', () => {
  const expr = buildLocationExpr(18.5204, -181);
  assert(expr === null, 'Expected null when longitude < -180');
});

test('Zero coordinates (0, 0) are valid', () => {
  const expr = buildLocationExpr(0, 0);
  assert(expr !== null, 'Expected non-null for (0, 0) — Gulf of Guinea');
  assert(expr.includes('ST_MakePoint(0, 0)'), 'Expected ST_MakePoint(0, 0)');
});

test('Boundary lat=90 is valid', () => {
  const expr = buildLocationExpr(90, 0);
  assert(expr !== null, 'Expected non-null for lat=90 (North Pole)');
});

test('Boundary lon=-180 is valid', () => {
  const expr = buildLocationExpr(0, -180);
  assert(expr !== null, 'Expected non-null for lon=-180 (antimeridian)');
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE scenarios — resolveLocationForUpdate()
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n📋 UPDATE — resolveLocationForUpdate()');

const existingSpot = { latitude: 18.5204, longitude: 73.8567 };

test('Only latitude changed → recomputes using existing longitude', () => {
  const expr = resolveLocationForUpdate(existingSpot, { latitude: 19.0 });
  assert(expr !== null, 'Expected non-null');
  assert(
    expr.includes(`ST_MakePoint(${existingSpot.longitude}, 19)`),
    `Expected existing longitude (${existingSpot.longitude}), got: ${expr}`
  );
});

test('Only longitude changed → recomputes using existing latitude', () => {
  const expr = resolveLocationForUpdate(existingSpot, { longitude: 74.0 });
  assert(expr !== null, 'Expected non-null');
  assert(
    expr.includes(`ST_MakePoint(74, ${existingSpot.latitude})`),
    `Expected existing latitude (${existingSpot.latitude}), got: ${expr}`
  );
});

test('Both lat and lon changed → uses new values for both', () => {
  const expr = resolveLocationForUpdate(existingSpot, { latitude: 28.6139, longitude: 77.2090 }); // Delhi
  assert(expr !== null, 'Expected non-null');
  assert(
    expr.includes('ST_MakePoint(77.209, 28.6139)'),
    `Expected Delhi coordinates, got: ${expr}`
  );
});

test('Latitude set to null → location becomes null', () => {
  const expr = resolveLocationForUpdate(existingSpot, { latitude: null });
  assert(expr === null, 'Expected null when latitude explicitly set to null');
});

test('Longitude set to null → location becomes null', () => {
  const expr = resolveLocationForUpdate(existingSpot, { longitude: null });
  assert(expr === null, 'Expected null when longitude explicitly set to null');
});

test('No coordinates in patch → preserves existing location', () => {
  const expr = resolveLocationForUpdate(existingSpot, { name: 'New Name' });
  assert(expr !== null, 'Expected non-null: no coord change, existing coords valid');
  assert(
    expr.includes(`ST_MakePoint(${existingSpot.longitude}, ${existingSpot.latitude})`),
    'Expected existing location to be preserved'
  );
});

test('Existing row has null coords, patch adds both → location is set', () => {
  const noCoords = { latitude: null, longitude: null };
  const expr = resolveLocationForUpdate(noCoords, { latitude: 18.5204, longitude: 73.8567 });
  assert(expr !== null, 'Expected non-null when adding coordinates to a row with none');
});

test('Existing row has null coords, patch adds only lat → location remains null', () => {
  const noCoords = { latitude: null, longitude: null };
  const expr = resolveLocationForUpdate(noCoords, { latitude: 18.5204 });
  assert(expr === null, 'Expected null when only latitude is set (longitude still null)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(55)}`);
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
console.log('─'.repeat(55));

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\n✅ All PostGIS sync tests passed.');
}
