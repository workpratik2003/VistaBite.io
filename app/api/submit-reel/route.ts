import { NextRequest, NextResponse } from 'next/server'
import { submitReel } from '@/lib/db'
import { sendNewSubmissionNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      restaurant_name,
      creator_name,
      creator_email,
      instagram_url,
      meal_types,
      location_city,
      location_address,
      description,
    } = body

    // Validation
    if (!restaurant_name || !creator_name || !creator_email || !instagram_url || !location_city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Instagram URL
    if (!instagram_url.includes('instagram.com')) {
      return NextResponse.json(
        { error: 'Please provide a valid Instagram URL' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(creator_email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing submission:', { restaurant_name, creator_name })

    const result = await submitReel({
      restaurant_name,
      creator_name,
      creator_email,
      instagram_url,
      meal_types: meal_types || [],
      location_city,
      location_address: location_address || '',
      description: description || '',
    })

    console.log('[v0] Submission created:', result.id)

    // Send notification email to admin (don't fail submission if email fails)
    try {
      await sendNewSubmissionNotification(
        restaurant_name,
        creator_name,
        instagram_url,
        result.id
      )
    } catch (emailError) {
      console.warn('[v0] Email notification failed but submission succeeded:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your reel has been submitted for review.',
      submissionId: result.id,
    })
  } catch (error) {
    console.error('[v0] Submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit reel'
    console.error('[v0] Error details:', { error, errorMessage })
    return NextResponse.json(
      { error: `Failed to submit reel: ${errorMessage}` },
      { status: 500 }
    )
  }
}
