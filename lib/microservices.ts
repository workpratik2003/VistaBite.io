/**
 * Client for communicating with Python microservices
 */

const CONTENT_ANALYZER_URL = process.env.NEXT_PUBLIC_CONTENT_ANALYZER_URL || 'http://localhost:8001'
const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:8002'

export interface ReelAnalysis {
  is_food_related: boolean
  confidence: number
  meal_types: string[]
  quality_score: number
  detected_cuisines: string[]
  summary: string
  overall_score: number
}

export interface TrendingMeal {
  meal_type: string
  count: number
  percentage: number
}

export interface RestaurantRanking {
  restaurant_name: string
  total_reels: number
  avg_quality_score: number
  total_views: number
}

export interface LocationStats {
  city: string
  total_reels: number
  unique_restaurants: number
  popular_meal_types: [string, number][]
  avg_quality_score: number
}

export interface ContentInsights {
  total_submissions: number
  approved_submissions: number
  pending_submissions: number
  avg_quality_score: number
  most_common_meal_type: string | null
  top_city: string | null
  total_views: number
  approval_rate: number
}

// Content Analyzer Service
export const contentAnalyzerService = {
  async health() {
    try {
      const response = await fetch(`${CONTENT_ANALYZER_URL}/health`)
      return await response.json()
    } catch (error) {
      console.error('[v0] Content analyzer health check failed:', error)
      return { status: 'unhealthy', error: String(error) }
    }
  },

  async analyzeReel(
    caption: string,
    hashtags: string[],
    thumbnailUrl?: string
  ): Promise<ReelAnalysis> {
    try {
      const response = await fetch(`${CONTENT_ANALYZER_URL}/analyze-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          hashtags,
          thumbnail_url: thumbnailUrl,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[v0] Reel analysis failed:', error)
      throw error
    }
  },

  async analyzeBatch(
    reels: Array<{
      caption: string
      hashtags: string[]
      thumbnail_url?: string
    }>
  ) {
    try {
      const response = await fetch(`${CONTENT_ANALYZER_URL}/analyze-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reels }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[v0] Batch analysis failed:', error)
      throw error
    }
  },

  async getAvailableModels() {
    try {
      const response = await fetch(`${CONTENT_ANALYZER_URL}/models`)
      return await response.json()
    } catch (error) {
      console.error('[v0] Failed to fetch models:', error)
      throw error
    }
  },
}

// Analytics Service
export const analyticsService = {
  async health() {
    try {
      const response = await fetch(`${ANALYTICS_URL}/health`)
      return await response.json()
    } catch (error) {
      console.error('[v0] Analytics health check failed:', error)
      return { status: 'unhealthy', error: String(error) }
    }
  },

  async getTrendingMeals(days: number = 7): Promise<TrendingMeal[]> {
    try {
      const response = await fetch(
        `${ANALYTICS_URL}/trending-meals?days=${days}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.trending_meals
    } catch (error) {
      console.error('[v0] Failed to fetch trending meals:', error)
      return []
    }
  },

  async getRestaurantRankings(limit: number = 20): Promise<RestaurantRanking[]> {
    try {
      const response = await fetch(
        `${ANALYTICS_URL}/restaurant-rankings?limit=${limit}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.rankings
    } catch (error) {
      console.error('[v0] Failed to fetch restaurant rankings:', error)
      return []
    }
  },

  async getLocationStats(): Promise<LocationStats[]> {
    try {
      const response = await fetch(`${ANALYTICS_URL}/location-stats`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.locations
    } catch (error) {
      console.error('[v0] Failed to fetch location stats:', error)
      return []
    }
  },

  async getInsights(): Promise<ContentInsights | null> {
    try {
      const response = await fetch(`${ANALYTICS_URL}/insights`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.insights
    } catch (error) {
      console.error('[v0] Failed to fetch insights:', error)
      return null
    }
  },

  async getDashboard() {
    try {
      const response = await fetch(`${ANALYTICS_URL}/dashboard`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[v0] Failed to fetch dashboard:', error)
      throw error
    }
  },
}
