import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role required' },
        { status: 400 }
      )
    }

    if (!['user', 'content_maker'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user role
    const result = await pool.query(
      'UPDATE users SET role = $1, is_public = $2 WHERE id = $3 RETURNING id, role',
      [role, role === 'content_maker', userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Role set for user:', userId, 'to', role)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Role set successfully',
      user: result.rows[0],
    })

    // Set user_id cookie
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('[v0] Set role error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Error details:', errorMessage)
    
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database not initialized. Please try again in a moment.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to set role. Please try again.' },
      { status: 500 }
    )
  }
}
