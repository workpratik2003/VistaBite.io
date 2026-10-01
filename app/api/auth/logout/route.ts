import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'
import { createClearedSessionCookie } from '@/lib/auth'
import { getOptionalUser } from '@/lib/requireUser'

export async function POST(request: NextRequest) {
  try {
    // Get the current user (if any) to invalidate their session
    const user = await getOptionalUser(request)

    if (user) {
      // Extract session token from cookie
      const cookieHeader = request.headers.get('cookie')
      const cookies: Record<string, string> = {}
      if (cookieHeader) {
        for (const cookie of cookieHeader.split(';')) {
          const [name, ...valueParts] = cookie.split('=')
          if (name && valueParts.length > 0) {
            cookies[name.trim()] = decodeURIComponent(valueParts.join('='))
          }
        }
      }

      const token = cookies['vistabite_session']

      if (token) {
        await deleteSession(token)
      }
    }

    // Idempotent: even if no user was found, still clear the cookie
    const clearedCookie = createClearedSessionCookie()
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.set(
      clearedCookie.name,
      clearedCookie.value,
      clearedCookie.options
    )

    return response
  } catch (error) {
    console.error('[v0] Logout error:', error)

    // Still clear the cookie on error to ensure the user is logged out
    const clearedCookie = createClearedSessionCookie()
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' }
    )

    response.cookies.set(
      clearedCookie.name,
      clearedCookie.value,
      clearedCookie.options
    )

    return response
  }
}