import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateToken, deleteToken } from '@/lib/tokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const result = await validateToken(token, 'email')

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired token' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: result.userId },
      data: { emailVerified: new Date() },
    })

    await deleteToken(token)

    return NextResponse.json(
      { message: 'Email verified successfully. You can now log in.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

