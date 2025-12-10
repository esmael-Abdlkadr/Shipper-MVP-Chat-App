import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatSessions = await prisma.chatSession.findMany({
      where: {
        participants: { some: { id: session.user.id } },
      },
      include: {
        participants: {
          where: { id: { not: session.user.id } },
          select: { id: true, name: true, image: true, isOnline: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formatted = chatSessions.map((s) => ({
      id: s.id,
      participant: s.participants[0] || null,
      lastMessage: s.messages[0] || null,
      updatedAt: s.updatedAt,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantId } = await request.json()
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 })
    }

    // Check if session already exists
    const existing = await prisma.chatSession.findFirst({
      where: {
        AND: [
          { participants: { some: { id: session.user.id } } },
          { participants: { some: { id: participantId } } },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ id: existing.id, existing: true })
    }

    // Create new session
    const newSession = await prisma.chatSession.create({
      data: {
        participants: {
          connect: [{ id: session.user.id }, { id: participantId }],
        },
      },
    })

    return NextResponse.json({ id: newSession.id, existing: false }, { status: 201 })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

