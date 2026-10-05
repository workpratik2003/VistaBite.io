'use client';

/**
 * BiteMapPage — shared page-level shell for the BiteMap product experience.
 *
 * Owns:
 *  - browser geolocation state
 *  - selected radius
 *  - Nearby API requests
 *  - Nearby loading/error state
 *  - selected spot state
 *  - page-level controls
 *
 * Does NOT own MapLibre initialization, marker lifecycle, or place-detail rendering.
 * Those concerns live in BiteMap.tsx and BiteMapPlaceCard.tsx.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { BiteMap } from '@/components/bitemap/BiteMap';
import { BiteMapPlaceCard } from '@/components/bitemap/BiteMapPlaceCard';
import { SavedSpot, SavedReel, NearbySavedSpot } from '@/lib/v2-types';
import { Navbar } from '@/components/navbar';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_RADII_KM = [1, 2, 5, 10, 25] as const;
const DEFAULT_RADIUS_KM = 5;

// Location request states
type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' }
  | { status: 'error'; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialCenter(spots: SavedSpot[]): [number, number] {
  const first = spots.find(
    (s) => s.latitude != null && s.longitude != null && !isNaN(s.latitude!) && !isNaN(s.longitude!)
  );
  return first ? [first.longitude as number, first.latitude as number] : [78.9800, 18.5204];
}

function isSpotStillNearby(
  spot: SavedSpot | null,
  nearby: NearbySavedSpot[]
): boolean {
  if (!spot) return false;
  return nearby.some((s) => s.id === spot.id);
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BiteMapPageProps {
  /** Optional heading override for the page */
  heading?: string;
  /** Optional subheading override */
  subheading?: string;
  /** Optional extra className for the root container */
  className?: string;
}

export function BiteMapPage({
  heading = 'My BiteMap',
  subheading = 'Explore your saved food spots on a map. Use your location to see what\'s nearby.',
  className = '',
}: BiteMapPageProps) {
  // ─── Global saved spots (existing Phase 1D-4 map behavior) ────────────────
  const [spots, setSpots] = useState<SavedSpot[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalFetchError, setGlobalFetchError] = useState<string | null>(null);

  // ─── Nearby / geolocation state ───────────────────────────────────────────
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [nearbySpots, setNearbySpots] = useState<NearbySavedSpot[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(DEFAULT_RADIUS_KM);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── Selected spot / reels state (existing Phase 1D-4 behavior) ───────────
  const [selectedSpot, setSelectedSpot] = useState<SavedSpot | null>(null);
  const [selectedReels, setSelectedReels] = useState<SavedReel[] | null>(null);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelsError, setReelsError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // ─── Fetch all global spots (unchanged map behavior) ───────────────────────
  useEffect(() => {
    async function fetchSpots() {
      try {
        setGlobalLoading(true);
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
        setGlobalFetchError(err.message);
      } finally {
        setGlobalLoading(false);
      }
    }
    fetchSpots();
  }, []);

  // ─── Fetch reels for selected spot ────────────────────────────────────────
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

  // ─── Browser geolocation ───────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (location.status === 'requesting') return;

    setLocation({ status: 'requesting' });

    if (!navigator.geolocation) {
      setLocation({
        status: 'error',
        message: 'Your browser does not support geolocation.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setLocation({
            status: 'error',
            message: 'Invalid coordinates received from your browser.',
          });
          return;
        }
        setLocation({ status: 'granted', latitude, longitude });
        setNearbyError(null);
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              'Location permission was denied. Please enable location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              'Your location could not be determined. Please check that location services are enabled and try again.';
            break;
          case error.TIMEOUT:
            message =
              'The location request timed out. Please try again.';
            break;
          default:
            message = 'Could not determine your location. Please try again.';
        }
        setLocation({ status: 'error', message });
      }
    );
  }, [location.status]);

  // ─── Nearby API calls ──────────────────────────────────────────────────────
  const fetchNearbySpots = useCallback(
    async (lat: number, lng: number, radius: number) => {
      // Cancel any in-flight Nearby request to avoid stale responses
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setNearbyLoading(true);
      setNearbyError(null);

      try {
        const res = await fetch(
          `/api/favorites/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to view your nearby places.');
          }
          if (res.status === 400) {
            const data = await res.json().catch(() => ({}));
            const detail = (data.details as Record<string, string[]>)?.radius?.[0] ??
                           (data.details as Record<string, string[]>)?.lat?.[0] ??
                           (data.details as Record<string, string[]>)?.lng?.[0] ??
                           'Invalid request parameters';
            throw new Error(`Validation error: ${detail}`);
          }
          throw new Error(`Failed to fetch nearby spots (${res.status})`);
        }

        const data = await res.json();
        setNearbySpots(data.spots ?? []);
      } catch (err: any) {
        // Ignore AbortError — a newer request replaced this one
        if (err.name === 'AbortError') {
          return;
        }
        setNearbyError(err.message || 'Failed to fetch nearby spots');
        setNearbySpots([]);
      } finally {
        setNearbyLoading(false);
      }
    },
    []
  );

  // ─── Radius change handler ─────────────────────────────────────────────────
  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setSelectedRadius(newRadius);
      if (location.status === 'granted') {
        fetchNearbySpots(location.latitude, location.longitude, newRadius);
      }
    },
    [location, fetchNearbySpots]
  );

  // ─── Nearby query runs when location + radius are both available ───────────
  useEffect(() => {
    if (location.status === 'granted') {
      fetchNearbySpots(location.latitude, location.longitude, selectedRadius);
    }
  }, [location, selectedRadius, fetchNearbySpots]);

  // ─── Selected spot must disappear when it leaves the radius window ─────────
  useEffect(() => {
    if (
      selectedSpot &&
      nearbySpots.length > 0 &&
      !isSpotStillNearby(selectedSpot, nearbySpots)
    ) {
      setSelectedSpot(null);
    }
  }, [nearbySpots, selectedSpot]);

  // ─── Marker click & close handlers ────────────────────────────────────────
  const handleMarkerClick = useCallback((spot: SavedSpot) => {
    setSelectedSpot(spot);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const center = buildInitialCenter(nearbySpots.length > 0 ? nearbySpots : spots);
  const hasUserLocation = location.status === 'granted';
  const userLocation =
    location.status === 'granted' ? { latitude: location.latitude, longitude: location.longitude } : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-screen bg-gray-50 overflow-hidden ${className}`}>
      <Navbar />

      {/* Controls bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{heading}</h1>
            {subheading && (
              <p className="text-sm text-muted-foreground">{subheading}</p>
            )}
          </div>

          {/* "Use My Location" button / status */}
          {location.status === 'idle' ? (
            <button
              onClick={requestLocation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Use my location to filter saved places nearby"
            >
              Use My Location
            </button>
          ) : location.status === 'requesting' ? (
            <span className="inline-flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
              Getting your location...
            </span>
          ) : location.status === 'granted' ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
              <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
              Location enabled
            </span>
          ) : location.status === 'denied' ? (
            <span className="inline-flex items-center gap-2 text-sm text-gray-700">
              <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
              Location access denied
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-red-700">
              <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
              {location.message}
              <button
                onClick={requestLocation}
                className="underline font-medium hover:no-underline ml-1"
              >
                Retry
              </button>
            </span>
          )}

          {/* Radius selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Radius:</span>
            <div className="flex items-center gap-1">
              {AVAILABLE_RADII_KM.map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  disabled={location.status !== 'granted'}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                    selectedRadius === radius
                      ? 'bg-blue-600 text-white border-blue-600'
                      : location.status !== 'granted'
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  aria-label={`${radius} km radius`}
                  aria-pressed={selectedRadius === radius}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Radius change loading indicator */}
        {nearbyLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
            Refreshing nearby places within {selectedRadius} km...
          </div>
        )}

        {/* Nearby count / empty state */}
        {!nearbyLoading && location.status === 'granted' && (
          <>
            {nearbySpots.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <span>
                  No saved places within {selectedRadius} km.
                </span>
                <span className="text-yellow-600">
                  Try a larger radius.
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                Showing {nearbySpots.length} saved place{nearbySpots.length !== 1 ? 's' : ''} within {selectedRadius} km.
              </div>
            )}
          </>
        )}

        {/* Nearby API error state (not empty) */}
        {nearbyError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="shrink-0 font-bold">✕</span>
            <span className="flex-1">{nearbyError}</span>
            {location.status === 'granted' && (
              <button
                onClick={() =>
                  fetchNearbySpots(location.latitude, location.longitude, selectedRadius)
                }
                className="underline font-medium hover:no-underline ml-1 shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Auth warning banner */}
        {globalFetchError && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="shrink-0 font-bold">✕</span>
            <span className="flex-1">{globalFetchError}</span>
          </div>
        )}

        {/* Location error banner */}
        {location.status === 'denied' && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="shrink-0 font-bold">✕</span>
            <span className="flex-1">
              Location permission was denied. Enable location access in your browser
              settings and click "Use My Location" to try again.
            </span>
            <button
              onClick={requestLocation}
              className="underline font-medium hover:no-underline ml-1 shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 relative flex min-h-0">
        {/* Map — always visible */}
        <div className="flex-1 relative min-h-0">
          {globalLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <BiteMap
              initialCenter={center}
              initialZoom={Math.max(spots.some((s) => s.latitude != null && s.longitude != null) ? 12 : 3, 3)}
              className="w-full h-full"
              spots={hasUserLocation ? nearbySpots : spots}
              onMarkerClick={handleMarkerClick}
              userLocation={userLocation}
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
              distanceMeters={
                location.status === 'granted' && nearbySpots.some((s) => s.id === selectedSpot.id)
                  ? nearbySpots.find((s) => s.id === selectedSpot.id)?.distance_meters
                  : undefined
              }
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
                distanceMeters={
                  location.status === 'granted' && nearbySpots.some((s) => s.id === selectedSpot.id)
                    ? nearbySpots.find((s) => s.id === selectedSpot.id)?.distance_meters
                    : undefined
                }
                className="flex-1 rounded-none border-0 border-t-0 shadow-none overflow-hidden"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}