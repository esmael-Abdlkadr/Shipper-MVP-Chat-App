import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, content, attachments } = await request.json()

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'Session ID and content required' }, { status: 400 })
    }

    // Verify user is participant
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        participants: { some: { id: session.user.id } },
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        sessionId,
        ...(attachments?.length && {
          attachments: {
            create: attachments.map((a: { url: string; type: string; name: string; size: number }) => ({
              url: a.url,
              type: a.type,
              name: a.name,
              size: a.size,
            })),
          },
        }),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    })

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

