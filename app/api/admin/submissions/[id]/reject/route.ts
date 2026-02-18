import { NextRequest, NextResponse } from 'next/server'
import { rejectSubmission, getSubmission } from '@/lib/db'
import { sendRejectionEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reason } = body
    
    // Get submission details before rejecting
    const submission = await getSubmission(id)
    
    const result = await rejectSubmission(id)
    
    console.log('[v0] Submission rejected:', id)
    
    // Send rejection email to creator
    if (submission) {
      await sendRejectionEmail(
        submission.restaurant_name,
        reason || 'Does not meet content guidelines',
        submission.creator_email
      )
    }
    
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
