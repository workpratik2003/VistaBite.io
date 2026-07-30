import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({ creators: [] })
    }

    const result = await pool.query(
      `SELECT 
        id,
        name,
        bio,
        profile_image_url,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = users.id) as follower_count,
        (SELECT COUNT(*) FROM ugc_videos WHERE creator_id = users.id) as video_count,
        created_at
       FROM users
       WHERE role = 'content_maker' 
       AND is_public = TRUE
       AND name ILIKE $1
       ORDER BY follower_count DESC
       LIMIT 20`,
      [`%${query}%`]
    )

    console.log('[v0] Search results:', result.rows.length, 'creators found')

    return NextResponse.json({
      creators: result.rows,
    })
  } catch (error) {
    console.error('[v0] Creator search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
