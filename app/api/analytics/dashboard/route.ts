import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/microservices'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Generating dashboard data')

    const dashboard = await analyticsService.getDashboard()

    return NextResponse.json({
      success: true,
      ...dashboard,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate dashboard'
    console.error('[v0] Dashboard generation error:', errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
