import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PersonalityType, PERSONALITIES } from '@/lib/ai/config'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile = await prisma.userAIProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      profile = await prisma.userAIProfile.create({
        data: { userId: session.user.id },
      })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personality } = await request.json()

    if (personality && !PERSONALITIES[personality as PersonalityType]) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 })
    }

    let profile = await prisma.userAIProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      profile = await prisma.userAIProfile.create({
        data: { 
          userId: session.user.id,
          personality: personality || 'bestie',
        },
      })
    } else {
      profile = await prisma.userAIProfile.update({
        where: { userId: session.user.id },
        data: { personality },
      })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

