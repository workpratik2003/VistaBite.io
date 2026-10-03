'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Hash,
  MapPin,
  Calendar,
  Navigation,
  Film,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Instagram,
  FileText,
} from 'lucide-react';
import { SavedSpot, SavedReel } from '@/lib/v2-types';
import { cn } from '@/lib/utils';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

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
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
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

/**
 * Format Instagram URL for clean display (e.g., instagram.com/reel/C123...)
 */
function formatDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `instagram.com${pathname}`;
  } catch {
    return url;
  }
}

/**
 * Format distance from meters into a human-readable string.
 * PostGIS distance_meters is authoritative; no client-side geospatial math.
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  // Round to at most 1 decimal place, trimming trailing zeros
  return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BiteMapPlaceCardProps {
  spot: SavedSpot;
  /** Reels associated with this spot, or null/undefined when not available */
  reels?: SavedReel[] | null;
  /** True when reels are actively loading */
  reelsLoading?: boolean;
  /** Error message if reels fetch failed */
  reelsError?: string | null;
  /** Retry callback if reels fetch failed */
  onRetryReels?: () => void;
  /** Close callback for closing card / bottom sheet */
  onClose: () => void;
  /** Optional extra class names applied to the card root */
  className?: string;
  /** Distance from user location in meters (Nearby mode only) */
  distanceMeters?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BiteMapPlaceCard({
  spot,
  reels,
  reelsLoading = false,
  reelsError = null,
  onRetryReels,
  onClose,
  className,
  distanceMeters,
}: BiteMapPlaceCardProps) {
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
        'flex flex-col bg-background border border-border rounded-2xl shadow-xl overflow-hidden max-h-full',
        className
      )}
      role="dialog"
      aria-modal="false"
      aria-label={`Place details for ${spot.name}`}
    >
      {/* ── Header (Spot Identity) ── */}
      <div className="relative shrink-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border px-5 py-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors border border-border/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close place details"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Sequence badge + Business type badge + optional distance badge */}
        <div className="flex items-center gap-2 mb-2 pr-8 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
            <Hash className="h-3 w-3" />
            {spot.save_sequence}
          </span>
          {businessLabel && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border/50">
              {businessLabel}
            </span>
          )}
          {distanceMeters !== undefined && distanceMeters !== null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary shadow-sm">
              <MapPin className="h-3 w-3" />
              {formatDistance(distanceMeters)}
            </span>
          )}
        </div>

        {/* Spot Name */}
        <h2 className="text-lg font-bold text-foreground leading-snug pr-8 tracking-tight">
          {spot.name}
        </h2>

        {/* Cuisine subtitle */}
        {spot.cuisine && (
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">{spot.cuisine}</p>
        )}
      </div>

      {/* ── Body (Scrollable Details & Reels) ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {/* Location & Metadata Section */}
        <div className="space-y-2.5 text-sm">
          {/* Address */}
          {addressLine && (
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground leading-tight">{addressLine}</span>
            </div>
          )}

          {/* Saved date */}
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span>Saved on {formatDate(spot.created_at)}</span>
          </div>

          {/* Notes */}
          {spot.notes && (
            <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                Notes
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {spot.notes}
              </p>
            </div>
          )}
        </div>

        {/* ── Reels Section ── */}
        <div className="pt-3 border-t border-border">
          {/* Reels Section Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                <Instagram className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Saved Reels
              </span>
              {reels && reels.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {reels.length}
                </span>
              )}
            </div>

            {reelsLoading && (
              <span className="text-xs text-muted-foreground animate-pulse font-medium">
                Loading...
              </span>
            )}
          </div>

          {/* 1. Loading State Skeleton */}
          {reelsLoading && (
            <div className="space-y-2.5" aria-busy="true" aria-label="Loading reels">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-border/60 bg-muted/30 animate-pulse space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
                      <div className="h-3.5 w-24 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="h-6 w-20 rounded-lg bg-muted-foreground/20" />
                  </div>
                  <div className="h-3 w-3/4 rounded bg-muted-foreground/15" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Error State */}
          {!reelsLoading && reelsError && (
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{reelsError}</span>
              </div>
              {onRetryReels && (
                <button
                  onClick={onRetryReels}
                  id={`retry-reels-spot-${spot.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive"
                  aria-label="Retry loading reels"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
            </div>
          )}

          {/* 3. Empty State */}
          {!reelsLoading && !reelsError && reels && reels.length === 0 && (
            <div className="flex flex-col items-center justify-center p-5 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
              <Film className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs font-semibold text-foreground">No saved reels</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No Instagram reels are linked to this spot.
              </p>
            </div>
          )}

          {/* 4. Loaded Reels List */}
          {!reelsLoading && !reelsError && reels && reels.length > 0 && (
            <div className="space-y-2.5">
              {reels.map((reel) => {
                const creatorText = reel.creator_handle
                  ? `@${reel.creator_handle}`
                  : reel.creator_name
                  ? reel.creator_name
                  : null;

                const displayUrl = formatDisplayUrl(reel.instagram_url);

                return (
                  <div
                    key={reel.id}
                    className="group p-3 rounded-xl border border-border/80 bg-card hover:bg-accent/30 transition-all space-y-2"
                  >
                    {/* Top Row: Creator info & Watch button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="shrink-0 p-1 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                          <Instagram className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          {creatorText ? (
                            <p className="text-xs font-bold text-foreground truncate">
                              {creatorText}
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-muted-foreground">
                              Instagram Reel
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Watch Reel Button */}
                      <a
                        href={reel.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        id={`watch-reel-map-${reel.id}`}
                        aria-label={`Watch Reel ${creatorText ? `by ${creatorText}` : ''} on Instagram`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <span>Watch</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Caption snippet if present */}
                    {reel.caption && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                        &ldquo;{reel.caption}&rdquo;
                      </p>
                    )}

                    {/* Display URL */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 truncate pt-0.5">
                      <span className="truncate">{displayUrl}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Actions (Fixed at bottom) ── */}
      <div className="shrink-0 px-5 py-4 border-t border-border bg-muted/30 space-y-2">
        {/* Directions */}
        {hasDirections && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`directions-spot-${spot.id}`}
            aria-label={`Get directions to ${spot.name}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </a>
        )}

        {/* View Details */}
        <Link
          href={`/favorites/${spot.id}`}
          id={`view-details-spot-${spot.id}`}
          aria-label={`View full details for ${spot.name}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span>View Full Details</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
