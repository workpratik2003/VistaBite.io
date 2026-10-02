/**
 * POST /api/favorites/spots
 * Create a new saved spot for the authenticated user.
 * save_sequence is assigned server-side; client cannot supply it.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/requireUser';
import { createSavedSpot, getSavedSpotsForUser } from '@/lib/db';

const CreateSpotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  business_type: z
    .enum(['restaurant', 'cafe', 'hotel', 'food_truck', 'bakery', 'bar', 'other'])
    .optional(),
  cuisine: z.string().max(255).optional(),
  address: z.string().optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(255).optional(),
  country: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location_source: z
    .enum(['manual', 'ai_extracted', 'user_edited', 'geocoded', 'gps'])
    .optional(),
  location_confidence: z.number().min(0).max(1).optional(),
  user_confirmed: z.boolean().optional(),
  notes: z.string().optional(),
  // Explicitly strip client-supplied save_sequence / user_id
  save_sequence: z.never().optional(),
  user_id: z.never().optional(),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const spot = await createSavedSpot(user.id, parsed.data);
    return NextResponse.json({ spot }, { status: 201 });
  } catch (error) {
    console.error('[api/favorites/spots POST]', error);
    return NextResponse.json({ error: 'Failed to create spot' }, { status: 500 });
  }
}

/**
 * GET /api/favorites/spots
 * List all saved spots for the authenticated user, ordered by save_sequence ASC.
 */
export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const spots = await getSavedSpotsForUser(user.id);
    return NextResponse.json({ spots });
  } catch (error) {
    console.error('[api/favorites/spots GET]', error);
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 });
  }
}
