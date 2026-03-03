import { NextRequest, NextResponse } from 'next/server'
import { contentAnalyzerService } from '@/lib/microservices'

/**
 * API route to analyze reel content using Python microservice
 * Forwards requests to FastAPI Content Analyzer service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caption, hashtags, thumbnailUrl } = body

    console.log('[v0] Analyzing content via microservice...')

    if (!caption) {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      )
    }

    const analysis = await contentAnalyzerService.analyzeReel(
      caption,
      hashtags || [],
      thumbnailUrl
    )

    console.log('[v0] Content analysis complete:', analysis.overall_score)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
    console.error('[v0] Content analysis error:', errorMessage)
    return NextResponse.json(
      { error: `Failed to analyze content: ${errorMessage}` },
      { status: 500 }
    )
  }
}
