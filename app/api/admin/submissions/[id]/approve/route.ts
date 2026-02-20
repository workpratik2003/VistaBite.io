import { NextRequest, NextResponse } from 'next/server'
import { approveSubmission, getSubmission } from '@/lib/db'
import { sendApprovalEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get submission details before approving
    const submission = await getSubmission(id)
    
    const result = await approveSubmission(id)
    
    console.log('[v0] Submission approved:', id)
    
    // Send approval email to creator
    if (submission) {
      await sendApprovalEmail(submission.restaurant_name, submission.creator_email)
    }
    
    return NextResponse.json({
      success: true,
      submission: result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[v0] Approve error:', errorMessage)
    console.error('[v0] Full error:', error)
    return NextResponse.json(
      { error: `Failed to approve submission: ${errorMessage}` },
      { status: 500 }
    )
  }
}
