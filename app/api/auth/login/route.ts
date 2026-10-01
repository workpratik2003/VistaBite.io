import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyUserCredentials, createSession } from '@/lib/db'
import { createSessionCookieOptions } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid login attempt' },
        { status: 401 }
      )
    }

    const { email, password } = validation.data

    // Verify credentials using existing DB helper.
    // Returns user if valid, null otherwise.
    // Generic error message - does not reveal whether email exists or password was wrong.
    const user = await verifyUserCredentials(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid login attempt' },
        { status: 401 }
      )
    }

    // Create new session
    const token = await createSession(user.id)

    // Set session cookie
    const cookieOptions = createSessionCookieOptions()
    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }
    )

    response.cookies.set(
      cookieOptions.name,
      token,
      cookieOptions.options
    )

    return response
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login. Please try again.' },
      { status: 500 }
    )
  }
}