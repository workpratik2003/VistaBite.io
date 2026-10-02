/**
 * /favorites/[id]/edit — Edit a saved spot
 * Server Component. Ownership verified server-side.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Hash } from 'lucide-react';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { getSavedSpotForUser } from '@/lib/db';
import { EditSpotForm } from '@/components/favorites/edit-spot-form';

export const metadata: Metadata = {
  title: 'Edit Spot – VistaBite',
};

type Props = { params: Promise<{ id: string }> };

export default async function EditSpotPage({ params }: Props) {
  const cookieStore = await cookies();
  const token = parseCookies(cookieStore.toString())[getSessionCookieName()];
  if (!token) redirect('/login?redirect=/favorites');

  const user = await getSessionUser(token);
  if (!user) redirect('/login?redirect=/favorites');

  const { id } = await params;
  const spot = await getSavedSpotForUser(user.id, id).catch(() => null);
  if (!spot) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative z-10 container mx-auto px-4 md:px-6 py-10 max-w-2xl">
        {/* Back */}
        <Link
          href={`/favorites/${spot.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to spot
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
              <Hash className="h-3 w-3" />
              {spot.save_sequence}
            </span>
            <span className="text-xs text-muted-foreground">
              Saved Spot #{spot.save_sequence} · read-only
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Edit {spot.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spot #{spot.save_sequence} — your sequence number never changes.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <EditSpotForm spot={spot} />
        </div>
      </div>
    </div>
  );
}
