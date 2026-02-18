'use client';

import { useState, useEffect } from 'react';
import { LocationSearch } from '@/components/location-search';
import { MealFilter } from '@/components/meal-filter';
import { ReelCard } from '@/components/reel-card';
import SubmitReelForm from '@/components/submit-reel-form';
import { type MealType } from '@/lib/mock-data';
import { InstagramReel } from '@/lib/types';
import { UtensilsCrossed, MapPin, Search, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    console.log('[v0] Location updated:', { lat, lng, address });
    setUserLocation({ lat, lng, address });
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((type) => type !== mealType)
        : [...prev, mealType]
    );
  };

  const handleSearch = async () => {
    if (!searchQuery && !userLocation && selectedMealTypes.length === 0) {
      setError('Please enter a search term or select your location');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log('[v0] Starting search from database...');
      
      // First try to fetch from database
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
          return;
        }
      }

      // Fallback to original search API
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
      console.error('[v0] Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search. Please try again.');
      setReels([]);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-balance">FoodReels</h1>
              <p className="text-xs text-muted-foreground">AI-powered restaurant discovery</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 md:px-6 py-6 md:py-8">
        {/* Mock data notice */}
        {usingMockData && hasSearched && (
          <div className="max-w-4xl mx-auto mb-6">
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
        <div className="max-w-4xl mx-auto mb-8 space-y-6">
          {/* Main search bar */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Search for restaurants</h2>
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>AI Filtered</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., breakfast pune karvenagar, cafe, italian restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Location search */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </h2>
            <LocationSearch
              onLocationChange={handleLocationChange}
              isLoading={false}
            />
            {userLocation && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Searching near:{' '}
                  <span className="font-medium text-foreground">
                    {userLocation.address}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Meal type filters */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
            <MealFilter
              selectedMealTypes={selectedMealTypes}
              onMealTypeToggle={handleMealTypeToggle}
            />
          </div>
        </div>

        {/* Results section */}
        <div className="max-w-7xl mx-auto">
          {/* Results header */}
          {hasSearched && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isLoading ? 'Searching Instagram reels...' : 'Search Results'}
              </h2>
              <p className="text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    AI is analyzing reels for relevance and quality...
                  </span>
                ) : (
                  <>
                    Found {reels.length} relevant reel{reels.length !== 1 ? 's' : ''}
                    {selectedMealTypes.length > 0 && (
                      <span>
                        {' '}
                        for{' '}
                        {selectedMealTypes.map((type, i) => (
                          <span key={type}>
                            {i > 0 && (i === selectedMealTypes.length - 1 ? ' and ' : ', ')}
                            <span className="font-medium">{type}</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Reels grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[9/16] bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : hasSearched && reels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No relevant reels found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search terms or location. Our AI filters ensure only food-related content is shown.
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Discover amazing restaurants</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Search for your favorite meals, enter your location, and let our AI find the best Instagram reels from restaurants and creators near you.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-sm">
                <span className="px-3 py-1 bg-muted rounded-full">breakfast pune</span>
                <span className="px-3 py-1 bg-muted rounded-full">cafe karvenagar</span>
                <span className="px-3 py-1 bg-muted rounded-full">dinner spots</span>
                <span className="px-3 py-1 bg-muted rounded-full">dessert places</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Powered by AI to show only relevant food content from Instagram
          </p>
        </div>
      </footer>

      {/* Submit Reel Form */}
      <SubmitReelForm />
    </div>
  );
}
