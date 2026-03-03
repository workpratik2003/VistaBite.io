import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/microservices'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')

    console.log('[v0] Fetching trending meals for', days, 'days')

    const trending = await analyticsService.getTrendingMeals(days)

    return NextResponse.json({
      success: true,
      trending,
      period_days: days,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trending'
    console.error('[v0] Trending fetch error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
