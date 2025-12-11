import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ModelId, DEFAULT_MODEL } from '@/lib/ai/config'

// GET /api/user/settings - Get user settings
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredAIModel: true,
      },
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    return NextResponse.json({
      preferredAIModel: user.preferredAIModel || DEFAULT_MODEL,
    })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { preferredAIModel } = body

    // Validate model
    if (preferredAIModel && !['gemini', 'openai'].includes(preferredAIModel)) {
      return new Response('Invalid AI model', { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(preferredAIModel && { preferredAIModel }),
      },
      select: {
        preferredAIModel: true,
      },
    })

    return NextResponse.json({
      preferredAIModel: updatedUser.preferredAIModel,
    })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

