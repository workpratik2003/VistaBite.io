import { NextRequest, NextResponse } from 'next/server'
import { rejectSubmission } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await rejectSubmission(id)
    
    console.log('[v0] Submission rejected:', id)
    
    return NextResponse.json({
      success: true,
      submission: result,
    })
  } catch (error) {
    console.error('[v0] Reject error:', error)
    return NextResponse.json(
      { error: 'Failed to reject submission' },
      { status: 500 }
    )
  }
}
