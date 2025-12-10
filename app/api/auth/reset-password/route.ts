import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validateToken, deleteToken } from '@/lib/tokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const result = await validateToken(token, 'password-reset')

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired token' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: result.userId },
      data: { 
        password: hashedPassword,
        emailVerified: new Date(),
      },
    })

    await deleteToken(token)

    return NextResponse.json(
      { message: 'Password reset successfully. You can now log in with your new password.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

