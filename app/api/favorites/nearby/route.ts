/**
 * GET /api/favorites/nearby
 * Returns the authenticated user's saved spots within a given radius of a location.
 * Uses PostGIS spatial queries for accurate geographic filtering.
 *
 * Query Parameters:
 *   lat    - latitude (required, -90 to 90)
 *   lng    - longitude (required, -180 to 180)
 *   radius - radius in km (required, must be 1, 2, 5, 10, or 25)
 *
 * Response:
 *   {
 *     spots: NearbySavedSpot[],
 *     meta: { latitude, longitude, radius_km, count }
 *   }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/requireUser';
import { getNearbySavedSpotsForUser } from '@/lib/db';
import type { NearbySavedSpot } from '@/lib/v2-types';

const VALID_RADII_KM = [1, 2, 5, 10, 25] as const;

const NearbyQuerySchema = z.object({
  lat: z
    .string()
    .transform((val) => Number(val))
    .refine((n) => Number.isFinite(n) && n >= -90 && n <= 90, {
      message: 'Latitude must be a finite number between -90 and 90',
    }),
  lng: z
    .string()
    .transform((val) => Number(val))
    .refine((n) => Number.isFinite(n) && n >= -180 && n <= 180, {
      message: 'Longitude must be a finite number between -180 and 180',
    }),
  radius: z
    .string()
    .transform((val) => Number(val))
    .refine((n) => VALID_RADII_KM.includes(n as (typeof VALID_RADII_KM)[number]), {
      message: 'Radius must be one of: 1, 2, 5, 10, 25',
    }),
});

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const parsed = NearbyQuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    radius: searchParams.get('radius'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { lat, lng, radius } = parsed.data;

  try {
    const spots = await getNearbySavedSpotsForUser(user.id, lat, lng, radius);

    const response = {
      spots: spots as NearbySavedSpot[],
      meta: {
        latitude: lat,
        longitude: lng,
        radius_km: radius,
        count: spots.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[api/favorites/nearby GET]', error);
    return NextResponse.json({ error: 'Failed to fetch nearby spots' }, { status: 500 });
  }
}