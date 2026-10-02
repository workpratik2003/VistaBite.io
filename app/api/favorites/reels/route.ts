/**
 * POST /api/favorites/reels
 * Create a new saved reel attached to the authenticated user's spot.
 *
 * The server verifies that saved_spot_id belongs to the authenticated user.
 * user_id is assigned server-side; client must NOT supply it.
 * UNIQUE(user_id, instagram_url) prevents duplicate reels per user.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/requireUser';
import { createSavedReel, getSavedSpotForUser } from '@/lib/db';

const CreateReelSchema = z.object({
  saved_spot_id: z.string().uuid('saved_spot_id must be a valid UUID'),
  instagram_url: z
    .string()
    .url('instagram_url must be a valid URL')
    .max(500),
  instagram_shortcode: z.string().max(100).optional(),
  creator_name: z.string().max(255).optional(),
  creator_handle: z.string().max(255).optional(),
  caption: z.string().optional(),
  thumbnail_url: z.string().url().max(1000).optional(),
  extracted_text: z.string().optional(),
  transcript: z.string().optional(),
  // Client must not supply user_id
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

  const parsed = CreateReelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Ownership check: verify the target spot belongs to the authenticated user.
  // This prevents User A from attaching a reel to User B's spot.
  const spot = await getSavedSpotForUser(user.id, parsed.data.saved_spot_id);
  if (!spot) {
    return NextResponse.json(
      { error: 'Saved spot not found or does not belong to you' },
      { status: 404 }
    );
  }

  try {
    const reel = await createSavedReel({
      ...parsed.data,
      user_id: user.id, // always server-assigned
    });
    return NextResponse.json({ reel }, { status: 201 });
  } catch (error: unknown) {
    // Postgres unique_violation code = '23505'
    const pgError = error as { code?: string };
    if (pgError?.code === '23505') {
      return NextResponse.json(
        { error: 'You have already saved this Instagram Reel' },
        { status: 409 }
      );
    }
    console.error('[api/favorites/reels POST]', error);
    return NextResponse.json({ error: 'Failed to create reel' }, { status: 500 });
  }
}
