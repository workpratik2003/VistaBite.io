export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'cafe' | 'dessert';

export interface Reel {
  id: string;
  restaurantId: string;
  restaurantName: string;
  instagramUrl: string;
  thumbnailUrl: string;
  title: string;
  mealTypes: MealType[];
  creatorName: string;
  creatorType: 'owner' | 'content_creator';
  views: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
}

// Mock data with realistic Instagram reel URLs and restaurant information
export const mockReels: Reel[] = [
  {
    id: '1',
    restaurantId: 'r1',
    restaurantName: 'The Morning Brew',
    instagramUrl: 'https://www.instagram.com/reel/sample1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=600&fit=crop',
    title: 'Best Avocado Toast in Town',
    mealTypes: ['breakfast', 'brunch'],
    creatorName: 'foodie_adventures',
    creatorType: 'content_creator',
    views: '12.5K',
    location: {
      lat: 40.7580,
      lng: -73.9855,
      address: '123 Broadway, New York',
      city: 'New York'
    }
  },
  {
    id: '2',
    restaurantId: 'r2',
    restaurantName: 'Pasta Paradise',
    instagramUrl: 'https://www.instagram.com/reel/sample2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=600&fit=crop',
    title: 'Handmade Pasta Making Process',
    mealTypes: ['lunch', 'dinner'],
    creatorName: 'PastaParadise',
    creatorType: 'owner',
    views: '25.3K',
    location: {
      lat: 40.7489,
      lng: -73.9680,
      address: '456 5th Avenue, New York',
      city: 'New York'
    }
  },
  {
    id: '3',
    restaurantId: 'r3',
    restaurantName: 'Coffee & Co',
    instagramUrl: 'https://www.instagram.com/reel/sample3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=600&fit=crop',
    title: 'Perfect Latte Art Tutorial',
    mealTypes: ['cafe', 'breakfast'],
    creatorName: 'CoffeeAndCo',
    creatorType: 'owner',
    views: '8.9K',
    location: {
      lat: 40.7614,
      lng: -73.9776,
      address: '789 Park Ave, New York',
      city: 'New York'
    }
  },
  {
    id: '4',
    restaurantId: 'r4',
    restaurantName: 'Sunset Grill',
    instagramUrl: 'https://www.instagram.com/reel/sample4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop',
    title: 'Wagyu Beef Dinner Experience',
    mealTypes: ['dinner'],
    creatorName: 'ny_food_critic',
    creatorType: 'content_creator',
    views: '45.2K',
    location: {
      lat: 40.7549,
      lng: -73.9840,
      address: '321 West St, New York',
      city: 'New York'
    }
  },
  {
    id: '5',
    restaurantId: 'r5',
    restaurantName: 'Sweet Tooth Bakery',
    instagramUrl: 'https://www.instagram.com/reel/sample5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=600&fit=crop',
    title: 'Chocolate Croissant Heaven',
    mealTypes: ['breakfast', 'dessert'],
    creatorName: 'SweetToothBakery',
    creatorType: 'owner',
    views: '18.7K',
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: '555 Madison Ave, New York',
      city: 'New York'
    }
  },
  {
    id: '6',
    restaurantId: 'r6',
    restaurantName: 'Taco Fiesta',
    instagramUrl: 'https://www.instagram.com/reel/sample6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop',
    title: 'Authentic Street Tacos',
    mealTypes: ['lunch', 'dinner'],
    creatorName: 'taco_lover_101',
    creatorType: 'content_creator',
    views: '32.1K',
    location: {
      lat: 40.7282,
      lng: -73.9942,
      address: '888 Canal St, New York',
      city: 'New York'
    }
  },
  {
    id: '7',
    restaurantId: 'r7',
    restaurantName: 'Green Bowl Cafe',
    instagramUrl: 'https://www.instagram.com/reel/sample7',
    thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=600&fit=crop',
    title: 'Healthy Buddha Bowl Recipe',
    mealTypes: ['lunch', 'brunch'],
    creatorName: 'healthy_eats_nyc',
    creatorType: 'content_creator',
    views: '15.6K',
    location: {
      lat: 40.7410,
      lng: -73.9897,
      address: '234 Union Square, New York',
      city: 'New York'
    }
  },
  {
    id: '8',
    restaurantId: 'r8',
    restaurantName: 'Sushi Master',
    instagramUrl: 'https://www.instagram.com/reel/sample8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop',
    title: 'Omakase Experience Night',
    mealTypes: ['dinner'],
    creatorName: 'SushiMasterNYC',
    creatorType: 'owner',
    views: '52.8K',
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: '777 7th Ave, New York',
      city: 'New York'
    }
  },
  {
    id: '9',
    restaurantId: 'r9',
    restaurantName: 'Brunch Spot',
    instagramUrl: 'https://www.instagram.com/reel/sample9',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=600&fit=crop',
    title: 'Bottomless Mimosas & Waffles',
    mealTypes: ['brunch', 'breakfast'],
    creatorName: 'brunch_squad',
    creatorType: 'content_creator',
    views: '28.4K',
    location: {
      lat: 40.7352,
      lng: -73.9910,
      address: '159 2nd Ave, New York',
      city: 'New York'
    }
  },
  {
    id: '10',
    restaurantId: 'r10',
    restaurantName: 'Pizza Porto',
    instagramUrl: 'https://www.instagram.com/reel/sample10',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=600&fit=crop',
    title: 'Wood Fired Neapolitan Pizza',
    mealTypes: ['lunch', 'dinner'],
    creatorName: 'PizzaPortoOfficial',
    creatorType: 'owner',
    views: '41.3K',
    location: {
      lat: 40.7218,
      lng: -73.9986,
      address: '987 Mulberry St, New York',
      city: 'New York'
    }
  },
  {
    id: '11',
    restaurantId: 'r11',
    restaurantName: 'Dessert Dreams',
    instagramUrl: 'https://www.instagram.com/reel/sample11',
    thumbnailUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=600&fit=crop',
    title: 'Matcha Tiramisu Creation',
    mealTypes: ['dessert', 'cafe'],
    creatorName: 'dessert_hunter',
    creatorType: 'content_creator',
    views: '22.9K',
    location: {
      lat: 40.7306,
      lng: -73.9352,
      address: '654 Bedford Ave, Brooklyn',
      city: 'Brooklyn'
    }
  },
  {
    id: '12',
    restaurantId: 'r12',
    restaurantName: 'Spice Route',
    instagramUrl: 'https://www.instagram.com/reel/sample12',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=600&fit=crop',
    title: 'Butter Chicken Perfection',
    mealTypes: ['lunch', 'dinner'],
    creatorName: 'SpiceRouteNYC',
    creatorType: 'owner',
    views: '36.7K',
    location: {
      lat: 40.7455,
      lng: -73.9803,
      address: '432 Lexington Ave, New York',
      city: 'New York'
    }
  }
];

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Filter reels based on location and meal types
export function filterReels(
  reels: Reel[],
  userLat?: number,
  userLng?: number,
  maxDistance: number = 10, // km
  selectedMealTypes?: MealType[]
): Reel[] {
  let filtered = reels;

  // Filter by location if coordinates provided
  if (userLat !== undefined && userLng !== undefined) {
    filtered = filtered.filter((reel) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        reel.location.lat,
        reel.location.lng
      );
      return distance <= maxDistance;
    });
  }

  // Filter by meal types if selected
  if (selectedMealTypes && selectedMealTypes.length > 0) {
    filtered = filtered.filter((reel) =>
      reel.mealTypes.some((type) => selectedMealTypes.includes(type))
    );
  }

  return filtered;
}
