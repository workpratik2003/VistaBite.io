/**
 * /favorites — Authenticated user's Favorites list
 * Server Component. Session verified server-side via getSessionUser.
 * Spots displayed in save_sequence order (#1, #2, #3…).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BookmarkCheck, Plus, Utensils, MapPin, Film, ChevronRight, Pencil } from 'lucide-react';
import { getSessionCookieName, parseCookies } from '@/lib/auth';
import { getSessionUser } from '@/lib/session';
import { getSavedSpotsForUser } from '@/lib/db';
import { DeleteSpotButton } from '@/components/favorites/delete-spot-button';

export const metadata: Metadata = {
  title: 'My Favorites – VistaBite',
  description: 'Your saved restaurants, cafes and food spots.',
};

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
    month: 'short',
    year: 'numeric',
  });
}

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const token = parseCookies(cookieStore.toString())[getSessionCookieName()];
  if (!token) redirect('/login?redirect=/favorites');

  const user = await getSessionUser(token);
  if (!user) redirect('/login?redirect=/favorites');

  const spots = await getSavedSpotsForUser(user.id).catch(() => []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <BookmarkCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">My Favorites</h1>
              <p className="text-sm text-muted-foreground">
                {spots.length === 0
                  ? 'No saved spots yet'
                  : `${spots.length} saved spot${spots.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <Link
            href="/add-reel"
            id="favorites-add-reel"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add a Reel
          </Link>
        </div>

        {/* Empty state */}
        {spots.length === 0 && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
                <Utensils className="h-9 w-9 text-muted-foreground/50" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No saved food spots yet</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Paste an Instagram Reel URL to save a restaurant, café, or food spot to your
              personal favorites.
            </p>
            <Link
              href="/add-reel"
              id="favorites-empty-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add a Reel
            </Link>
          </div>
        )}

        {/* Spot cards */}
        {spots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                {/* Sequence badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow">
                    #{spot.save_sequence}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5 pt-12">
                  <h2 className="text-base font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {spot.name}
                  </h2>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {spot.business_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {BUSINESS_TYPE_LABELS[spot.business_type] ?? spot.business_type}
                      </span>
                    )}
                    {spot.cuisine && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {spot.cuisine}
                      </span>
                    )}
                  </div>

                  {(spot.address || spot.city) && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {[spot.address, spot.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <Film className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {spot.reel_count === 0
                        ? 'No reels saved'
                        : `${spot.reel_count} saved reel${spot.reel_count === 1 ? '' : 's'}`}
                    </span>
                    <span className="ml-auto">Saved {formatDate(spot.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Link
                      href={`/favorites/${spot.id}`}
                      id={`view-spot-${spot.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      View
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/favorites/${spot.id}/edit`}
                      id={`edit-spot-${spot.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Link>
                    <DeleteSpotButton
                      spotId={spot.id}
                      spotName={spot.name}
                      saveSequence={spot.save_sequence}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
