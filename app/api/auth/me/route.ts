import { NextRequest, NextResponse } from 'next/server'
import { getOptionalUser } from '@/lib/requireUser'

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser(request)

    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[v0] Auth me error:', error)
    return NextResponse.json({ authenticated: false })
  }
}