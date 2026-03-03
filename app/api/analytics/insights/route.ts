import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/microservices'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Fetching content insights')

    const insights = await analyticsService.getInsights()

    return NextResponse.json({
      success: true,
      insights,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insights'
    console.error('[v0] Insights fetch error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
