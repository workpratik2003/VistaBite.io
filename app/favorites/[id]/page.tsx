/**
 * /favorites/[id] — Spot detail with associated reels
 * Server Component. Ownership verified via getSavedSpotWithReels.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import {
  MapPin,
  Utensils,
  Building2,
  Film,
  ExternalLink,
  ArrowLeft,
  Pencil,
  Calendar,
  Hash,
} from 'lucide-react';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { getSavedSpotWithReels } from '@/lib/db';
import { DeleteSpotButton } from '@/components/favorites/delete-spot-button';
import { DeleteReelButton } from '@/components/favorites/delete-reel-button';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: 'Spot Details – VistaBite' };
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  hotel: 'Hotel',
  food_truck: 'Food Truck',
  bakery: 'Bakery',
  bar: 'Bar',
  other: 'Food Spot',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function SpotDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const token = parseCookies(cookieStore.toString())[getSessionCookieName()];
  if (!token) redirect('/login?redirect=/favorites');

  const user = await getSessionUser(token);
  if (!user) redirect('/login?redirect=/favorites');

  const { id } = await params;
  const result = await getSavedSpotWithReels(user.id, id).catch(() => null);
  if (!result) notFound();

  const { spot, reels } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        {/* Back */}
        <Link
          href="/favorites"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          id="spot-detail-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Favorites
        </Link>

        {/* Spot card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  <Hash className="h-3 w-3" />
                  {spot.save_sequence}
                </span>
                {spot.business_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    {BUSINESS_TYPE_LABELS[spot.business_type] ?? spot.business_type}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{spot.name}</h1>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/favorites/${spot.id}/edit`}
                id={`edit-spot-${spot.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
              <DeleteSpotButton
                spotId={spot.id}
                spotName={spot.name}
                saveSequence={spot.save_sequence}
              />
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spot.cuisine && (
              <div className="flex items-start gap-2.5">
                <Utensils className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Cuisine</p>
                  <p className="text-sm text-foreground">{spot.cuisine}</p>
                </div>
              </div>
            )}
            {(spot.address || spot.city) && (
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-sm text-foreground">
                    {[spot.address, spot.city, spot.state, spot.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
            {spot.business_type && (
              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Type</p>
                  <p className="text-sm text-foreground">
                    {BUSINESS_TYPE_LABELS[spot.business_type] ?? spot.business_type}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Saved on</p>
                <p className="text-sm text-foreground">{formatDate(spot.created_at)}</p>
              </div>
            </div>
            {spot.notes && (
              <div className="flex items-start gap-2.5 col-span-full">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-sm text-foreground leading-relaxed">{spot.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reels section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Film className="h-4 w-4 text-muted-foreground" />
              Saved Reels
              {reels.length > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {reels.length}
                </span>
              )}
            </h2>
          </div>

          {reels.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl px-6 py-10 text-center">
              <Film className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reels saved for this spot yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reels.map((reel, idx) => (
                <div
                  key={reel.id}
                  className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {reel.creator_name && (
                      <p className="text-xs font-semibold text-foreground mb-0.5 truncate">
                        {reel.creator_handle ? `@${reel.creator_handle}` : reel.creator_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{reel.instagram_url}</p>
                    {reel.caption && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 italic">
                        {reel.caption}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={reel.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`watch-reel-${reel.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Watch
                    </a>
                    <DeleteReelButton reelId={reel.id} spotId={spot.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
