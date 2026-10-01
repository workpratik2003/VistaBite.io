import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'
import { createUser, createSession, getUserByEmail } from '@/lib/db'
import { getSessionCookieName, createSessionCookieOptions } from '@/lib/auth'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .refine(
      (password) => /[A-Za-z]/.test(password) && /[0-9]/.test(password),
      'Password must contain at least one letter and one number'
    ),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // Check for duplicate email
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user
    const user = await createUser(email, name, passwordHash)

    // Create session
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
      },
      { status: 201 }
    )

    response.cookies.set(
      cookieOptions.name,
      token,
      cookieOptions.options
    )

    return response
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register. Please try again.' },
      { status: 500 }
    )
  }
}