'use client';

import React, { useEffect, useState } from 'react';
import { BiteMap } from '@/components/bitemap/BiteMap';
import { Navbar } from '@/components/navbar';
import { SavedSpot } from '@/lib/v2-types';

export default function BiteMapTestPage() {
  const [spots, setSpots] = useState<SavedSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpots() {
      try {
        setLoading(true);
        const res = await fetch('/api/favorites/spots');
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to view your spots on the map.');
          }
          throw new Error('Failed to fetch spots');
        }
        const data = await res.json();
        setSpots(data.spots || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSpots();
  }, []);

  const handleMarkerClick = (spot: SavedSpot) => {
    setSelectedSpotId(spot.id);
    console.log('Marker clicked:', spot);
  };

  // Center map on the first valid spot if available, otherwise fallback
  const firstValidSpot = spots.find(
    (s) => s.latitude != null && s.longitude != null && !isNaN(s.latitude) && !isNaN(s.longitude)
  );

  const center: [number, number] = firstValidSpot
    ? [firstValidSpot.longitude as number, firstValidSpot.latitude as number]
    : [-122.4194, 37.7749]; // San Francisco fallback

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">BiteMap (Phase 1D-2)</h1>
          <p className="text-gray-500 mt-2">
            Development page verifying MapLibre GL JS markers connected to the V2 Favorites system.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && spots.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-md">
            You have no saved places yet, or none of them have valid coordinates.
          </div>
        )}

        {selectedSpotId && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm font-mono">
            Selected Spot ID: {selectedSpotId} (check browser console for full spot data)
          </div>
        )}

        <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm min-h-[500px]">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
             </div>
          ) : (
            <BiteMap
              initialCenter={center}
              initialZoom={firstValidSpot ? 12 : 3}
              className="w-full h-full"
              spots={spots}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      </main>
    </div>
  );
}
