import { InstagramReel, MealType } from './types';
import { mockReels } from './mock-data';

/**
 * Mock intelligent search that simulates AI-powered filtering
 * This works without requiring external APIs
 */
export function searchMockReels(
  query: string,
  location: string | null,
  mealType: MealType | null
): InstagramReel[] {
  let filteredReels = [...mockReels];

  // Filter by meal type if specified
  if (mealType) {
    filteredReels = filteredReels.filter((reel) =>
      reel.mealType.includes(mealType)
    );
  }

  // Filter by location if specified (case-insensitive partial match)
  if (location) {
    const locationLower = location.toLowerCase();
    filteredReels = filteredReels.filter((reel) =>
      reel.location.toLowerCase().includes(locationLower) ||
      locationLower.includes(reel.location.toLowerCase())
    );
  }

  // Filter by search query (searches in title, caption, restaurant name, hashtags)
  if (query) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(' ').filter(Boolean);
    
    filteredReels = filteredReels.filter((reel) => {
      const searchableText = [
        reel.title,
        reel.caption,
        reel.restaurantName,
        reel.location,
        ...reel.hashtags,
      ].join(' ').toLowerCase();

      // Check if any query term matches
      return queryTerms.some((term) => searchableText.includes(term));
    });
  }

  // Simulate AI relevance scoring and sorting
  const scoredReels = filteredReels.map((reel) => {
    let relevanceScore = 0;

    // Boost score if query matches restaurant name
    if (query && reel.restaurantName.toLowerCase().includes(query.toLowerCase())) {
      relevanceScore += 3;
    }

    // Boost score if meal type matches
    if (mealType && reel.mealType.includes(mealType)) {
      relevanceScore += 2;
    }

    // Boost score if location is exact match
    if (location && reel.location.toLowerCase() === location.toLowerCase()) {
      relevanceScore += 2;
    }

    // Boost score based on view count (popular content)
    const viewCount = parseInt(reel.viewCount.replace(/[^0-9]/g, '')) || 0;
    relevanceScore += Math.min(viewCount / 10000, 3);

    return { reel, relevanceScore };
  });

  // Sort by relevance score
  scoredReels.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredReels.map((item) => item.reel);
}

/**
 * Simulate AI analysis delay for realistic UX
 */
export async function mockAIDelay(): Promise<void> {
  // Simulate processing time (500-1500ms)
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}
