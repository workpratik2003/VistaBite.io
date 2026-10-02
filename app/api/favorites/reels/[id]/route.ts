/**
 * GET    /api/favorites/reels/[id] — get a single saved reel (ownership verified)
 * DELETE /api/favorites/reels/[id] — delete a saved reel (ownership verified via spot)
 */

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/requireUser';
import { getSavedReelForUser, deleteSavedReel } from '@/lib/db';

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
    const reel = await getSavedReelForUser(user.id, id);
    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ reel });
  } catch (error) {
    console.error('[api/favorites/reels/[id] GET]', error);
    return NextResponse.json({ error: 'Failed to fetch reel' }, { status: 500 });
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
    const deleted = await deleteSavedReel(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/favorites/reels/[id] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 });
  }
}
