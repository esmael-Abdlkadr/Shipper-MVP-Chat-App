import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MESSAGES_PER_PAGE = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        participants: { some: { id: session.user.id } },
      },
      include: {
        participants: {
          select: { id: true, name: true, image: true, isOnline: true, lastSeen: true },
        },
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { sessionId },
      take: MESSAGES_PER_PAGE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
        reactions: true,
        replyTo: {
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    })

    const hasMore = messages.length > MESSAGES_PER_PAGE
    const items = hasMore ? messages.slice(0, -1) : messages
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    const otherParticipant = chatSession.participants.find((p) => p.id !== session.user.id)

    return NextResponse.json({
      session: {
        id: chatSession.id,
        participant: otherParticipant,
      },
      messages: items.reverse(),
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

