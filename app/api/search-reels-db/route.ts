import { NextRequest, NextResponse } from 'next/server'
import { searchReels, getFilteredReels } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, location, mealType } = body

    console.log('[v0] Database search request:', { query, location, mealType })

    let results

    if (query) {
      // Search by query, location, and meal type
      results = await searchReels(query, location, mealType)
    } else {
      // Filter by location and meal type only
      results = await getFilteredReels(mealType, location)
    }

    // Convert database records to InstagramReel format
    const reels = results.map((row: any) => ({
      id: row.id,
      title: `${row.restaurant_name} - ${row.description || 'Food Reel'}`,
      caption: row.description || '',
      thumbnailUrl: `https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=600&fit=crop`, // Placeholder
      instagramUrl: row.instagram_url,
      restaurantName: row.restaurant_name,
      location: row.location_address || row.location_city,
      mealType: Array.isArray(row.meal_types) ? row.meal_types : [],
      creatorName: row.creator_name,
      creatorHandle: row.creator_name.toLowerCase().replace(/\s+/g, '_'),
      viewCount: '0+',
      hashtags: [
        `#${row.location_city.replace(/\s+/g, '')}`,
        ...((Array.isArray(row.meal_types) ? row.meal_types : []) || []).map((t: string) => `#${t}`),
      ],
    }))

    console.log('[v0] Database search found:', reels.length, 'reels')

    return NextResponse.json({
      reels,
      total: reels.length,
      source: 'database',
    })
  } catch (error) {
    console.error('[v0] Database search error:', error)
    return NextResponse.json(
      { error: 'Failed to search reels' },
      { status: 500 }
    )
  }
}
