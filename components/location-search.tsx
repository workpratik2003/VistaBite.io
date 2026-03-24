'use client';

import { useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationSearchProps {
  onLocationChange: (lat: number, lng: number, address: string, confirmed: boolean) => void;
  isLoading?: boolean;
}

export function LocationSearch({ onLocationChange, isLoading }: LocationSearchProps) {
  const [manualLocation, setManualLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationChange(latitude, longitude, 'Your current location', true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('[v0] Geolocation error:', error);
        setError('Unable to get your location. Please enter manually.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;

    // For demo purposes, use default coordinates when manual location is entered
    // In production, you would use a geocoding API like Google Maps or Mapbox
    const defaultLat = 40.7580;
    const defaultLng = -73.9855;
    
    onLocationChange(defaultLat, defaultLng, manualLocation, true);
    setError('');
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <form onSubmit={handleManualSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter city, address, or zipcode"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className="pl-10"
              disabled={isLoading || isGettingLocation}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || isGettingLocation || !manualLocation.trim()}
            size="icon"
            className="shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        onClick={handleGetCurrentLocation}
        disabled={isLoading || isGettingLocation}
        variant="outline"
        className="w-full"
      >
        <Navigation className="mr-2 h-4 w-4" />
        {isGettingLocation ? 'Getting location...' : 'Use my current location'}
      </Button>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
