'use client';

import { useState, useMemo } from 'react';
import { LocationSearch } from '@/components/location-search';
import { MealFilter } from '@/components/meal-filter';
import { ReelCard } from '@/components/reel-card';
import { mockReels, filterReels, type MealType } from '@/lib/mock-data';
import { UtensilsCrossed, MapPin } from 'lucide-react';

export default function Page() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setIsLoading(true);
    console.log('[v0] Location updated:', { lat, lng, address });
    setUserLocation({ lat, lng, address });
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((type) => type !== mealType)
        : [...prev, mealType]
    );
  };

  const filteredReels = useMemo(() => {
    return filterReels(
      mockReels,
      userLocation?.lat,
      userLocation?.lng,
      10, // 10km radius
      selectedMealTypes.length > 0 ? selectedMealTypes : undefined
    );
  }, [userLocation, selectedMealTypes]);

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
              <p className="text-xs text-muted-foreground">Discover places through reels</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 md:px-6 py-6 md:py-8">
        {/* Search and filters section */}
        <div className="max-w-4xl mx-auto mb-8 space-y-6">
          {/* Location search */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Find restaurants near you
            </h2>
            <LocationSearch
              onLocationChange={handleLocationChange}
              isLoading={isLoading}
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {userLocation ? 'Reels near you' : 'Popular reels'}
            </h2>
            <p className="text-muted-foreground">
              {isLoading ? (
                'Loading...'
              ) : (
                <>
                  Found {filteredReels.length} reel{filteredReels.length !== 1 ? 's' : ''}
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

          {/* Reels grid */}
          {filteredReels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredReels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No reels found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {userLocation
                  ? 'Try adjusting your filters or searching in a different location.'
                  : 'Enter your location to discover restaurants and cafes near you.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          <p>Discover the best restaurants and cafes through authentic content</p>
        </div>
      </footer>
    </div>
  );
}
