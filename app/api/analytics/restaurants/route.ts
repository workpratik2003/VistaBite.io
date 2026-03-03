import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/microservices'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('[v0] Fetching top', limit, 'restaurants')

    const rankings = await analyticsService.getRestaurantRankings(limit)

    return NextResponse.json({
      success: true,
      rankings,
      total: rankings.length,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rankings'
    console.error('[v0] Rankings fetch error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
