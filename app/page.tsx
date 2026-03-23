'use client';

import { useState, useEffect } from 'react';
import { LocationSearch } from '@/components/location-search';
import { MealFilter } from '@/components/meal-filter';
import { ReelCard } from '@/components/reel-card';
import SubmitReelForm from '@/components/submit-reel-form';
import { type MealType } from '@/lib/mock-data';
import { InstagramReel } from '@/lib/types';
import { UtensilsCrossed, MapPin, Search, Sparkles, Sun } from 'lucide-react';
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
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((type) => type !== mealType)
        : [...prev, mealType]
    );
  };

  const isSearchEnabled = searchQuery.trim() !== '' && userLocation && selectedMealTypes.length > 0;

  const handleSearch = async () => {
    if (!isSearchEnabled) {
      setError('Please fill in all fields: search, location, and meal type');
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
      console.error('[v0] Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search. Please try again.');
      setReels([]);
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
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,107,53,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,107,53,0.05),transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-6 max-w-2xl">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 text-balance">
            <span className="text-foreground">Vistabite</span>
          </h1>
          
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Vistabite</h1>
              <p className="text-xs text-muted-foreground">Restaurant Discovery</p>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" id="search-section">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container px-4 md:px-6 py-12 md:py-16">
          {usingMockData && hasSearched && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Using Demo Mode</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      Currently showing sample data with simulated AI filtering. To enable real Instagram reel search, add your RapidAPI key in the Vars section of the sidebar.
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-xl border-2 border-orange-200 bg-[hsl(var(--section-search))] shadow-sm hover:shadow-md transition-shadow">
                <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-orange-600" />
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

              <div className="p-6 rounded-xl border-2 border-blue-200 bg-[hsl(var(--section-location))] shadow-sm hover:shadow-md transition-shadow">
                <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Location
                </label>
                <LocationSearch onLocationChange={handleLocationChange} isLoading={isLoading} />
                {userLocation && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">✓ {userLocation.address}</p>
                )}
              </div>

              <div className="p-6 rounded-xl border-2 border-purple-200 bg-[hsl(var(--section-filter))] shadow-sm hover:shadow-md transition-shadow">
                <label className="text-sm font-bold mb-3 block text-foreground flex items-center gap-2">
                  <Sun className="h-4 w-4 text-purple-600" />
                  Meal Type
                </label>
                <MealFilter selectedMealTypes={selectedMealTypes} onMealTypeToggle={handleMealTypeToggle} />
                {selectedMealTypes.length > 0 && (
                  <p className="text-xs text-purple-600 mt-2 font-medium">✓ {selectedMealTypes.length} selected</p>
                )}
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <Button
                onClick={handleSearch}
                disabled={!isSearchEnabled || isLoading}
                className={`px-12 py-3 text-lg font-semibold transition-all ${
                  isSearchEnabled
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                size="lg"
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
          </div>

          {hasSearched && (
            <div className="max-w-7xl mx-auto mt-16">
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

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[9/16] bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : reels.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reels.map((reel) => (
                    <ReelCard key={reel.id} reel={reel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No relevant reels found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Try adjusting your search terms or location. Our AI filters ensure only food-related content is shown.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Powered by AI to show only relevant food content from Instagram
          </p>
        </div>
      </footer>

      <SubmitReelForm />
    </div>
  );
}
