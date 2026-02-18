import { NextRequest, NextResponse } from 'next/server'
import { approveSubmission } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await approveSubmission(id)
    
    console.log('[v0] Submission approved:', id)
    
    return NextResponse.json({
      success: true,
      submission: result,
    })
  } catch (error) {
    console.error('[v0] Approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve submission' },
      { status: 500 }
    )
  }
}
