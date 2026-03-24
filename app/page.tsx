'use client';

import { useState, useEffect } from 'react';
import { LocationSearch } from '@/components/location-search';
import { MealFilter } from '@/components/meal-filter';
import { ReelCard } from '@/components/reel-card';
import SubmitReelForm from '@/components/submit-reel-form';
import { type MealType } from '@/lib/mock-data';
import { InstagramReel } from '@/lib/types';
import { UtensilsCrossed, MapPin, Search, Sparkles, CheckCircle, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationChange = (lat: number, lng: number, address: string, confirmed: boolean) => {
    setUserLocation({ lat, lng, address });
    setLocationConfirmed(confirmed);
  };

  const handleConfirmLocation = () => {
    if (userLocation) {
      setLocationConfirmed(true);
    }
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((type) => type !== mealType)
        : [...prev, mealType].slice(0, 2)
    );
  };

  const isSearchEnabled = 
    searchQuery.trim() !== '' && 
    userLocation !== null && 
    locationConfirmed === true && 
    selectedMealTypes.length > 0;

  const handleSearch = async () => {
    if (!isSearchEnabled) {
      setError('Please fill all three sections: restaurant name, confirm location, and select meal type');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const dbResponse = await fetch('/api/search-reels-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: userLocation?.address || '',
          mealType: selectedMealTypes[0],
        }),
      });

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.reels && dbData.reels.length > 0) {
          setReels(dbData.reels);
          setUsingMockData(false);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/search-reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: userLocation?.address || '',
          mealType: selectedMealTypes[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search reels');
      }

      const data = await response.json();
      setReels(data.reels);
      setUsingMockData(data.usingMockData || false);
    } catch (err) {
      console.error('[v0] Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isSearchEnabled) {
      handleSearch();
    }
  };

  if (!mounted) {
    return null;
  }

  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-2xl">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-2 text-balance">
            <span className="text-foreground">Vistabite</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest mb-6">
            AI powered restaurant discovery
          </p>

          <p className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/80 mb-12 tracking-wide leading-relaxed">
            See it. Crave it. Bite it.
          </p>
          
          <div className="space-y-8">
            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest">
              Discover authentic food experiences through Instagram reels
            </p>
            
            <button
              onClick={() => setHasSearched(true)}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors inline-block"
            >
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container px-4 md:px-6 py-12 md:py-16" id="search-section">
        {usingMockData && hasSearched && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Using Demo Mode</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Currently showing sample data. Add RapidAPI key for real Instagram reels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              Discover Your Next Favorite Restaurant
            </h2>
            <p className="text-muted-foreground text-lg">
              Fill in all three sections to find the perfect place
            </p>
          </div>

          <div className="space-y-8 mb-8">
            {/* Section 1: Restaurant Name */}
            <div className="p-6 rounded-xl border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                Restaurant Name or Cuisine
              </label>
              <Input
                type="text"
                placeholder="e.g., cafe, pizza, biryani, restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-white/50 border-orange-300 focus:border-orange-500"
              />
              {searchQuery.trim() !== '' && (
                <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Filled
                </p>
              )}
            </div>

            {/* Section 2: Location */}
            <div className="p-6 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Location
              </label>
              <LocationSearch onLocationChange={handleLocationChange} isLoading={isLoading} />
              {userLocation && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {userLocation.address}
                  </p>
                  {!locationConfirmed && (
                    <button
                      onClick={handleConfirmLocation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Location
                    </button>
                  )}
                  {locationConfirmed && (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Location confirmed
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Meal Type */}
            <div className="p-6 rounded-xl border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                <Sun className="h-4 w-4 text-purple-600" />
                Meal Type (max 2)
              </label>
              <MealFilter selectedMealTypes={selectedMealTypes} onMealTypeToggle={handleMealTypeToggle} />
              {selectedMealTypes.length > 0 && (
                <p className="text-xs text-purple-600 mt-2 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {selectedMealTypes.length} selected
                </p>
              )}
            </div>
          </div>

          {/* Discover Restaurants Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={handleSearch}
              disabled={!isSearchEnabled || isLoading}
              className={`px-12 py-6 text-lg font-semibold transition-all rounded-lg ${
                isSearchEnabled
                  ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Search className="h-5 w-5 mr-2" />
              {isLoading ? 'Searching...' : 'Discover Restaurants'}
            </Button>
          </div>

          {!isSearchEnabled && (
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Fill all three sections to enable search
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 mb-8">
              {error}
            </div>
          )}

          {hasSearched && reels.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          )}

          {hasSearched && reels.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No restaurants found. Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t mt-16 relative z-10">
        <div className="container px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Powered by AI to show only relevant food content
          </p>
        </div>
      </footer>

      <SubmitReelForm />
    </div>
  );
}
