'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { SavedSpot } from '@/lib/v2-types';

export interface BiteMapProps {
  /**
   * Optional map style URL or StyleSpecification object.
   * If not provided, it falls back to NEXT_PUBLIC_MAP_STYLE_URL or a default demo style.
   */
  mapStyle?: string | StyleSpecification;
  /**
   * Initial center [longitude, latitude]
   */
  initialCenter?: [number, number];
  /**
   * Initial zoom level
   */
  initialZoom?: number;
  /**
   * Optional CSS class name for the map container
   */
  className?: string;
  /**
   * Callback fired when the map has finished loading
   */
  onLoad?: (map: Map) => void;
  /**
   * Optional list of saved spots to render as markers
   */
  spots?: SavedSpot[];
  /**
   * Callback fired when a spot marker is clicked
   */
  onMarkerClick?: (spot: SavedSpot) => void;
  /**
   * Optional current user location (browser GPS).
   * When provided, a distinct current-location marker is rendered
   * and the map is centered on it.
   */
  userLocation?: { latitude: number; longitude: number } | null;
}

export function BiteMap({
  mapStyle,
  initialCenter = [0, 0],
  initialZoom = 1,
  className = '',
  onLoad,
  spots,
  onMarkerClick,
  userLocation,
}: BiteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep track of saved-spot markers to clean them up when spots change
  const markersRef = useRef<maplibregl.Marker[]>([]);
  // Keep track of the current-location marker separately
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const defaultStyle =
        process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
        'https://demotiles.maplibre.org/style.json';

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle || defaultStyle,
        center: initialCenter,
        zoom: initialZoom,
      });

      // Add navigation controls (zoom in/out, compass)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setIsLoaded(true);
        if (onLoad) {
          onLoad(map);
        }
      });

      map.on('error', (e: any) => {
        console.error('MapLibre error:', e);
        setError(e.error || new Error('Map failed to load'));
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // We intentionally only run this on mount, preventing map recreation on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle marker rendering
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!spots) return;

    const map = mapInstanceRef.current;

    spots.forEach((spot) => {
      if (
        spot.latitude == null ||
        spot.longitude == null ||
        isNaN(spot.latitude) ||
        isNaN(spot.longitude)
      ) {
        return;
      }

      const el = document.createElement('div');
      el.className =
        'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md cursor-pointer border-2 border-white hover:bg-blue-700 transition-colors z-10';
      el.textContent = `#${spot.save_sequence}`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onMarkerClick) {
          onMarkerClick(spot);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [spots, isLoaded, onMarkerClick]);

  // Effect to handle current-location marker and map centering
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clean up existing current-location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    // If userLocation is provided, create marker and center map
    if (userLocation) {
      const el = document.createElement('div');
      el.className =
        'w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white hover:bg-blue-600 transition-colors z-10';
      el.textContent = '📍'; // GPS/current-location marker

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);

      userLocationMarkerRef.current = marker;

      // Fly to the user's location with a reasonable zoom level
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        essential: true, // This animation is considered essential
      });
    }
  }, [isLoaded, userLocation]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500 z-10">
          Failed to load map: {error.message}
        </div>
      )}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
