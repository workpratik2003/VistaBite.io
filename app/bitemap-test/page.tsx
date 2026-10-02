'use client';

/**
 * /bitemap-test — Phase 1D-4 Development/Testing Page
 *
 * Shows BiteMap with the authenticated user's saved spots as numbered markers.
 * Clicking a marker opens BiteMapPlaceCard with loading, empty, and retryable error states.
 * This is a temporary development page; do not link it from the main nav.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BiteMap } from '@/components/bitemap/BiteMap';
import { BiteMapPlaceCard } from '@/components/bitemap/BiteMapPlaceCard';
import { Navbar } from '@/components/navbar';
import { SavedSpot, SavedReel } from '@/lib/v2-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialCenter(spots: SavedSpot[]): [number, number] {
  const first = spots.find(
    (s) => s.latitude != null && s.longitude != null && !isNaN(s.latitude!) && !isNaN(s.longitude!)
  );
  return first ? [first.longitude as number, first.latitude as number] : [-122.4194, 37.7749];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BiteMapTestPage() {
  const [spots, setSpots] = useState<SavedSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected spot state
  const [selectedSpot, setSelectedSpot] = useState<SavedSpot | null>(null);
  const [selectedReels, setSelectedReels] = useState<SavedReel[] | null>(null);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelsError, setReelsError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // ── Fetch spots ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchSpots() {
      try {
        setLoading(true);
        const res = await fetch('/api/favorites/spots');
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to view your BiteMap.');
          }
          throw new Error(`Failed to fetch spots (${res.status})`);
        }
        const data = await res.json();
        setSpots(data.spots ?? []);
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSpots();
  }, []);

  // ── Fetch reels for selected spot ────────────────────────────────────────

  const fetchReelsForSpot = useCallback(async (spotId: string) => {
    setReelsLoading(true);
    setReelsError(null);
    setSelectedReels(null);

    try {
      const res = await fetch(`/api/favorites/spots/${spotId}`);
      if (!res.ok) {
        throw new Error(`Failed to load reels (${res.status})`);
      }
      const data = await res.json();
      setSelectedReels(data.reels ?? []);
    } catch (err: any) {
      setReelsError(err.message || 'Could not load reels for this spot');
    } finally {
      setReelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSpot) {
      setSelectedReels(null);
      setReelsError(null);
      setReelsLoading(false);
      return;
    }
    fetchReelsForSpot(selectedSpot.id);
  }, [selectedSpot, fetchReelsForSpot]);

  const handleRetryReels = useCallback(() => {
    if (selectedSpot) {
      fetchReelsForSpot(selectedSpot.id);
    }
  }, [selectedSpot, fetchReelsForSpot]);

  // ── Marker click & close handlers ───────────────────────────────────────

  const handleMarkerClick = useCallback((spot: SavedSpot) => {
    setSelectedSpot(spot);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const center = buildInitialCenter(spots);
  const initialZoom = spots.some(
    (s) => s.latitude != null && s.longitude != null
  ) ? 12 : 3;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Navbar />

      {/* Dev banner */}
      <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-1 font-medium">
        ⚠️ Development page — Phase 1D-4 BiteMap Place Detail Polish
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="shrink-0 px-4 py-3 bg-red-50 text-red-700 text-sm border-b border-red-200">
          {fetchError}
        </div>
      )}

      {/* Empty state banner */}
      {!loading && !fetchError && spots.length === 0 && (
        <div className="shrink-0 px-4 py-3 bg-yellow-50 text-yellow-800 text-sm border-b border-yellow-200">
          You have no saved places yet, or none have valid coordinates.
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="flex-1 relative flex min-h-0">

        {/* Map — always visible */}
        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <BiteMap
              initialCenter={center}
              initialZoom={initialZoom}
              className="w-full h-full"
              spots={spots}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>

        {/* ── Desktop: side panel ── */}
        {selectedSpot && (
          <div
            className={[
              'hidden md:flex flex-col',
              'w-80 lg:w-96 border-l border-border bg-background',
              'overflow-y-auto',
              'transition-all duration-300 ease-in-out',
            ].join(' ')}
          >
            <BiteMapPlaceCard
              spot={selectedSpot}
              reels={selectedReels}
              reelsLoading={reelsLoading}
              reelsError={reelsError}
              onRetryReels={handleRetryReels}
              onClose={handleClose}
              className="flex-1 rounded-none border-0 shadow-none"
            />
          </div>
        )}

        {/* ── Mobile: bottom sheet ── */}
        {selectedSpot && (
          <>
            {/* Scrim */}
            <div
              className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
              onClick={handleClose}
              aria-hidden
            />

            {/* Sheet */}
            <div
              ref={cardRef}
              className={[
                'md:hidden fixed bottom-0 left-0 right-0 z-50',
                'max-h-[80vh] flex flex-col',
                'bg-background rounded-t-2xl shadow-2xl',
                'animate-in slide-in-from-bottom duration-300',
              ].join(' ')}
            >
              {/* Drag handle */}
              <div className="shrink-0 flex justify-center pt-3 pb-1 bg-background rounded-t-2xl border-t border-x border-border sticky top-0 z-10">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <BiteMapPlaceCard
                spot={selectedSpot}
                reels={selectedReels}
                reelsLoading={reelsLoading}
                reelsError={reelsError}
                onRetryReels={handleRetryReels}
                onClose={handleClose}
                className="flex-1 rounded-none border-0 border-t-0 shadow-none overflow-hidden"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
