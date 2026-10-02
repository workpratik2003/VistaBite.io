/**
 * GET  /api/favorites/spots/[id]  — get spot + its reels
 * PATCH /api/favorites/spots/[id] — update spot (save_sequence immutable)
 * DELETE /api/favorites/spots/[id] — delete spot (cascades to reels)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/requireUser';
import {
  getSavedSpotWithReels,
  updateSavedSpot,
  deleteSavedSpot,
} from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: RouteContext) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await ctx.params;

  try {
    const result = await getSavedSpotWithReels(user.id, id);
    if (!result) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/favorites/spots/[id] GET]', error);
    return NextResponse.json({ error: 'Failed to fetch spot' }, { status: 500 });
  }
}

const UpdateSpotSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  business_type: z
    .enum(['restaurant', 'cafe', 'hotel', 'food_truck', 'bakery', 'bar', 'other'])
    .optional(),
  cuisine: z.string().max(255).nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().max(255).nullable().optional(),
  state: z.string().max(255).nullable().optional(),
  country: z.string().max(255).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  location_source: z
    .enum(['manual', 'ai_extracted', 'user_edited', 'geocoded', 'gps'])
    .optional(),
  location_confidence: z.number().min(0).max(1).nullable().optional(),
  user_confirmed: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  // These fields must never be mutated
  id: z.never().optional(),
  user_id: z.never().optional(),
  save_sequence: z.never().optional(),
  created_at: z.never().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpdateSpotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Destructure the z.never() sentinel fields out before passing to db
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, user_id: _uid, save_sequence: _seq, created_at: _ca, ...updateData } = parsed.data;
    const spot = await updateSavedSpot(user.id, id, updateData);
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    return NextResponse.json({ spot });
  } catch (error) {
    console.error('[api/favorites/spots/[id] PATCH]', error);
    return NextResponse.json({ error: 'Failed to update spot' }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: RouteContext) {
  let user;
  try {
    user = await requireUser(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await ctx.params;

  try {
    const deleted = await deleteSavedSpot(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/favorites/spots/[id] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete spot' }, { status: 500 });
  }
}
