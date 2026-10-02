'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Hash,
  MapPin,
  Utensils,
  Building2,
  Calendar,
  Navigation,
  Film,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { SavedSpot } from '@/lib/v2-types';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

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

/**
 * Build a Google Maps directions URL from a spot.
 * Uses lat/lng if available, otherwise falls back to a formatted address string.
 */
function buildDirectionsUrl(spot: SavedSpot): string {
  if (spot.latitude != null && spot.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
  }
  const addressParts = [spot.address, spot.city, spot.state, spot.country].filter(Boolean);
  if (addressParts.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`;
  }
  return '#';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BiteMapPlaceCardProps {
  spot: SavedSpot;
  /** Reels associated with this spot, if already loaded; otherwise undefined to indicate "not loaded yet" */
  reels?: Array<{ id: string; instagram_url: string; creator_handle?: string | null; creator_name?: string | null }>;
  onClose: () => void;
  /** Optional extra class names applied to the card root */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BiteMapPlaceCard({ spot, reels, onClose, className }: BiteMapPlaceCardProps) {
  const directionsUrl = buildDirectionsUrl(spot);
  const hasDirections = directionsUrl !== '#';
  const businessLabel = spot.business_type
    ? (BUSINESS_TYPE_LABELS[spot.business_type] ?? spot.business_type)
    : null;

  const addressLine = [spot.address, spot.city, spot.state, spot.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={cn(
        'flex flex-col bg-background border border-border rounded-2xl shadow-xl overflow-hidden',
        className
      )}
      role="dialog"
      aria-modal="false"
      aria-label={`Place details for ${spot.name}`}
    >
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-5 py-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-background/70 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close place card"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Sequence badge + type badge */}
        <div className="flex items-center gap-2 mb-2 pr-8">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
            <Hash className="h-3 w-3" />
            {spot.save_sequence}
          </span>
          {businessLabel && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              {businessLabel}
            </span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-lg font-bold text-foreground leading-tight pr-8">{spot.name}</h2>

        {/* Cuisine subtitle */}
        {spot.cuisine && (
          <p className="text-sm text-muted-foreground mt-0.5">{spot.cuisine}</p>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Address */}
        {addressLine && (
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">{addressLine}</p>
          </div>
        )}

        {/* Cuisine (detail row) */}
        {spot.cuisine && (
          <div className="flex items-start gap-2.5">
            <Utensils className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">{spot.cuisine}</p>
          </div>
        )}

        {/* Business type */}
        {businessLabel && (
          <div className="flex items-start gap-2.5">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">{businessLabel}</p>
          </div>
        )}

        {/* Saved date */}
        <div className="flex items-start gap-2.5">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">Saved on {formatDate(spot.created_at)}</p>
        </div>

        {/* Notes */}
        {spot.notes && (
          <div className="mt-1 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Notes</p>
            <p className="text-sm text-foreground leading-relaxed">{spot.notes}</p>
          </div>
        )}

        {/* ── Reels ── */}
        {reels !== undefined && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Film className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Saved Reels
              </span>
              {reels.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {reels.length}
                </span>
              )}
            </div>

            {reels.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No reels saved for this spot.</p>
            ) : (
              <div className="space-y-2">
                {reels.map((reel) => (
                  <a
                    key={reel.id}
                    href={reel.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`watch-reel-map-${reel.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200/50 transition-colors group"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {reel.creator_handle
                        ? `@${reel.creator_handle}`
                        : reel.creator_name ?? 'Watch Reel'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0 group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions footer ── */}
      <div className="px-5 py-4 border-t border-border bg-muted/30 space-y-2">
        {/* Directions */}
        {hasDirections && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`directions-spot-${spot.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </a>
        )}

        {/* View Details */}
        <Link
          href={`/favorites/${spot.id}`}
          id={`view-details-spot-${spot.id}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          View Full Details
        </Link>
      </div>
    </div>
  );
}
