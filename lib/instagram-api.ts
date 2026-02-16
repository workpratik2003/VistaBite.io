import { RapidAPIReelResponse } from './types'

export async function searchInstagramReels(
  query: string,
  location?: string
): Promise<RapidAPIReelResponse[]> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
  
  if (!RAPIDAPI_KEY) {
    console.error('[v0] RAPIDAPI_KEY is not set')
    throw new Error('Instagram API is not configured. Please set RAPIDAPI_KEY.')
  }

  // Construct search query with location if provided
  const searchQuery = location ? `${query} ${location}` : query
  const hashtag = searchQuery.replace(/\s+/g, '')

  try {
    // Using RapidAPI Instagram API endpoint for hashtag search
    const response = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${encodeURIComponent(hashtag)}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract reels from the response
    const reels = data.data?.items || []
    
    // Filter for video content (reels)
    const videoReels = reels.filter((item: any) => item.video_url)
    
    return videoReels.slice(0, 20) // Limit to 20 reels
  } catch (error) {
    console.error('[v0] Instagram API Error:', error)
    throw error
  }
}

export async function searchInstagramByLocation(
  location: string,
  mealType?: string
): Promise<RapidAPIReelResponse[]> {
  const query = mealType ? `${mealType} ${location}` : location
  return searchInstagramReels(query)
}

export function formatInstagramUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/`
}

export function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g
  const matches = caption.match(hashtagRegex)
  return matches ? matches.map(tag => tag.slice(1)) : []
}

export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
