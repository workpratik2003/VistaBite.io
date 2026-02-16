export interface InstagramReel {
  id: string
  title: string
  caption: string
  thumbnailUrl: string
  instagramUrl: string
  restaurantName: string
  location: string
  mealType: string[]
  creatorName: string
  creatorHandle: string
  viewCount: string
  hashtags: string[]
}

export interface RapidAPIReelResponse {
  id: string
  caption: {
    text: string
  }
  thumbnail_url: string
  shortcode: string
  video_url: string
  owner: {
    username: string
    full_name: string
  }
  edge_media_to_caption?: {
    edges: Array<{
      node: {
        text: string
      }
    }>
  }
  location?: {
    name: string
  }
  video_view_count?: number
}

export interface AIAnalysisResult {
  isRelevant: boolean
  isFoodRelated: boolean
  confidence: number
  mealTypes: string[]
  location?: string
  restaurantName?: string
  reasoning: string
}
