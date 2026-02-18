import { NextResponse } from 'next/server'
import { getPendingSubmissions } from '@/lib/db'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM submissions ORDER BY created_at DESC'
    )
    return NextResponse.json({
      submissions: result.rows,
    })
  } catch (error) {
    console.error('[v0] Admin submissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
