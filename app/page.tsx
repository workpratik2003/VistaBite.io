'use client';

import { useState, useEffect } from 'react';
import { LocationSearch } from '@/components/location-search';
import { MealFilter } from '@/components/meal-filter';
import { ReelCard } from '@/components/reel-card';
import SubmitReelForm from '@/components/submit-reel-form';
import { type MealType } from '@/lib/mock-data';
import { InstagramReel } from '@/lib/types';
import { UtensilsCrossed, MapPin, Sparkles, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartExploring = () => {
    setHasSearched(true);
    setTimeout(() => {
      const searchElement = document.getElementById('search-section');
      if (searchElement) {
        searchElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    console.log('[v0] Location updated:', { lat, lng, address });
    setUserLocation({ lat, lng, address });
    setLocationConfirmed(false);
  };

  const handleConfirmLocation = () => {
    setLocationConfirmed(true);
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((type) => type !== mealType)
        : [...prev, mealType]
    );
  };

  const isSearchEnabled = searchQuery.trim() !== '' && userLocation && locationConfirmed && selectedMealTypes.length > 0;

  const handleSearch = async () => {
    if (!isSearchEnabled) {
      setError('Please fill in all fields: search, location (confirmed), and meal type');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log('[v0] Starting search from database...');
      
      const dbResponse = await fetch('/api/search-reels-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          location: userLocation?.address || '',
          mealType: selectedMealTypes.length > 0 ? selectedMealTypes[0] : undefined,
        }),
      });

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        console.log('[v0] Database search results:', dbData.total, 'reels');
        
        if (dbData.reels && dbData.reels.length > 0) {
          setReels(dbData.reels);
          setUsingMockData(false);
          setIsLoading(false);
          return;
        }
      }

      console.log('[v0] No database results, trying fallback search...');
      const response = await fetch('/api/search-reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          location: userLocation?.address || '',
          mealType: selectedMealTypes.length > 0 ? selectedMealTypes.join(' ') : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search reels');
      }

      const data = await response.json();
      console.log('[v0] Search results:', data.total, 'reels');
      setReels(data.reels);
      setUsingMockData(data.usingMockData || false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      console.error('[v0] Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!mounted) {
    return null;
  }

  // Show hero section if no search has been made
  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,107,53,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,107,53,0.05),transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-2xl">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-2 text-balance">
            <span className="text-foreground">Vistabite</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-6 tracking-widest uppercase">
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
              onClick={handleStartExploring}
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
        {/* Mock data notice */}
        {usingMockData && hasSearched && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Using Demo Mode
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    Currently showing sample data with simulated AI filtering. To enable real Instagram reel search, add your RapidAPI key in the Vars section of the sidebar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and filters section */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              Discover Your Next Favorite Restaurant
            </h2>
            <p className="text-muted-foreground text-lg">
              Fill in all sections to find the perfect place
            </p>
          </div>

          {/* Section 1: Restaurant Name */}
          <div className="mb-8 p-6 rounded-xl border-2 border-orange-200 bg-[hsl(var(--section-search))] shadow-sm hover:shadow-md transition-shadow">
            <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              Restaurant Name
            </label>
            <Input
              type="text"
              placeholder="e.g., cafe, pizza, biryani..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-white/50 border-orange-300 focus:border-orange-500"
            />
            {searchQuery && (
              <p className="text-xs text-orange-600 mt-2 font-medium">✓ Filled</p>
            )}
          </div>

          {/* Section 2: Location */}
          <div className="mb-8 p-6 rounded-xl border-2 border-blue-200 bg-[hsl(var(--section-location))] shadow-sm hover:shadow-md transition-shadow">
            <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Location
            </label>
            <LocationSearch onLocationChange={handleLocationChange} isLoading={isLoading} />
            
            {userLocation && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-blue-700 font-medium">
                  {userLocation.address}
                </p>
                <Button
                  onClick={handleConfirmLocation}
                  variant={locationConfirmed ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    locationConfirmed
                      ? 'bg-blue-600 text-white'
                      : 'border-blue-300 text-blue-600'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {locationConfirmed ? 'Confirmed' : 'Confirm'}
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Meal Type Filter */}
          <div className="mb-8 p-6 rounded-xl border-2 border-purple-200 bg-[hsl(var(--section-filter))] shadow-sm hover:shadow-md transition-shadow">
            <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
              <span>🍽️</span>
              Meal Type (Max 2)
            </label>
            <MealFilter selectedMealTypes={selectedMealTypes} onMealTypeToggle={handleMealTypeToggle} />
            {selectedMealTypes.length > 0 && (
              <p className="text-xs text-purple-600 mt-2 font-medium">✓ {selectedMealTypes.length} selected</p>
            )}
          </div>

          {/* Search Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={handleSearch}
              disabled={!isSearchEnabled || isLoading}
              className={`px-12 py-3 text-lg font-semibold transition-all ${
                isSearchEnabled
                  ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg hover:shadow-xl'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              size="lg"
            >
              {isLoading ? 'Searching...' : 'Discover Restaurants'}
            </Button>
          </div>

          {/* Helper Text */}
          {!isSearchEnabled && (
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                Fill all sections and confirm location to enable search
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 mb-8">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasSearched && reels.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8 text-foreground">
              Results for {searchQuery}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && reels.length === 0 && !isLoading && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground text-lg">No results found. Try different search terms or location.</p>
          </div>
        )}
      </div>

      {/* Submit Reel Form */}
      <SubmitReelForm />
    </div>
  );
}
