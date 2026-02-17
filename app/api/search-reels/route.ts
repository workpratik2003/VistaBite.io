import { NextRequest, NextResponse } from 'next/server'
import { searchInstagramReels, extractHashtags, formatInstagramUrl, formatViewCount } from '@/lib/instagram-api'
import { analyzeReelContent } from '@/lib/ai-analyzer'
import { InstagramReel } from '@/lib/types'
import { searchMockReels, mockAIDelay } from '@/lib/mock-search'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, location, mealType } = body

    console.log('[v0] Search request:', { query, location, mealType })

    if (!query && !location && !mealType) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      )
    }

    // Check if Instagram API is configured
    const hasRapidAPIKey = !!process.env.RAPIDAPI_KEY

    if (!hasRapidAPIKey) {
      // Use mock search with simulated AI delay
      console.log('[v0] Using mock search (no RapidAPI key configured)')
      
      await mockAIDelay()
      
      const filteredReels = searchMockReels(query, location, mealType)
      
      console.log('[v0] Mock search results:', filteredReels.length)
      
      return NextResponse.json({
        reels: filteredReels,
        total: filteredReels.length,
        usingMockData: true,
      })
    }

    // Real Instagram API search
    const searchQuery = [mealType, query, location].filter(Boolean).join(' ')
    
    console.log('[v0] Fetching reels from Instagram...')
    
    // Fetch reels from Instagram API with fallback to mock data
    let rawReels
    let usingFallback = false
    
    try {
      rawReels = await searchInstagramReels(searchQuery, location)
    } catch (apiError) {
      console.error('[v0] Instagram API failed, falling back to mock data:', apiError)
      
      // Fallback to mock data if API fails
      await mockAIDelay()
      const filteredReels = searchMockReels(query, location, mealType)
      
      return NextResponse.json({
        reels: filteredReels,
        total: filteredReels.length,
        usingMockData: true,
        apiError: apiError instanceof Error ? apiError.message : 'API Error',
      })
    }
    
    console.log('[v0] Fetched reels:', rawReels.length)

    // Analyze each reel with AI
    const analyzedReels: InstagramReel[] = []
    
    for (const reel of rawReels) {
      try {
        const caption = reel.edge_media_to_caption?.edges[0]?.node.text || reel.caption?.text || ''
        const hashtags = extractHashtags(caption)
        const thumbnailUrl = reel.thumbnail_url
        
        console.log('[v0] Analyzing reel:', reel.id)
        
        // AI analysis
        const analysis = await analyzeReelContent(
          caption,
          hashtags,
          searchQuery,
          location || '',
          thumbnailUrl
        )

        console.log('[v0] Analysis result:', {
          id: reel.id,
          isRelevant: analysis.isRelevant,
          isFoodRelated: analysis.isFoodRelated,
          confidence: analysis.confidence
        })

        // Only include if AI deems it relevant and food-related with good confidence
        if (analysis.isRelevant && analysis.isFoodRelated && analysis.confidence > 0.6) {
          const formattedReel: InstagramReel = {
            id: reel.id,
            title: caption.split('\n')[0].slice(0, 100) || 'Delicious Food',
            caption,
            thumbnailUrl,
            instagramUrl: formatInstagramUrl(reel.shortcode),
            restaurantName: analysis.restaurantName || reel.location?.name || 'Local Spot',
            location: analysis.location || reel.location?.name || location || 'Unknown',
            mealType: analysis.mealTypes.length > 0 ? analysis.mealTypes : [mealType || 'food'],
            creatorName: reel.owner.full_name || reel.owner.username,
            creatorHandle: reel.owner.username,
            viewCount: formatViewCount(reel.video_view_count || 0),
            hashtags,
          }

          analyzedReels.push(formattedReel)
        }
      } catch (error) {
        console.error('[v0] Error analyzing reel:', reel.id, error)
        // Continue with next reel
      }
    }

    console.log('[v0] Final filtered reels:', analyzedReels.length)

    return NextResponse.json({
      reels: analyzedReels,
      total: analyzedReels.length,
    })
  } catch (error) {
    console.error('[v0] Search API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search reels',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
