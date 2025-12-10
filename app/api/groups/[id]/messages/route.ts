import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const messages = await prisma.groupMessage.findMany({
      where: { 
        groupId,
        NOT: {
          deletedForUsers: {
            has: session.user.id,
          },
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            isAI: true,
            deletedAt: true,
            sender: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    })

    const formattedMessages = messages.map((m) => {
      const isDeleted = m.deletedAt !== null

      return {
        id: m.id,
        content: isDeleted ? '' : m.content,
        senderId: m.senderId,
        senderName: m.isAI ? 'Shipper' : m.sender?.name || 'Unknown',
        senderImage: m.isAI ? null : m.sender?.image || null,
        isAI: m.isAI,
        createdAt: m.createdAt,
        editedAt: m.editedAt,
        isDeleted,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              content: m.replyTo.deletedAt ? '' : m.replyTo.content,
              senderName: m.replyTo.isAI ? 'Shipper' : m.replyTo.sender?.name || 'Unknown',
              isAI: m.replyTo.isAI,
              isDeleted: m.replyTo.deletedAt !== null,
            }
          : null,
      }
    })

    return NextResponse.json(formattedMessages)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const { content, replyToId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: session.user.id,
        content: content.trim(),
        isAI: false,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            isAI: true,
            sender: {
              select: { name: true },
            },
          },
        },
      },
    })

    await prisma.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    })

    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender?.name || 'Unknown',
      senderImage: message.sender?.image || null,
      isAI: false,
      createdAt: message.createdAt,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: message.replyTo.isAI ? 'Shipper' : message.replyTo.sender?.name || 'Unknown',
            isAI: message.replyTo.isAI,
          }
        : null,
    }

    return NextResponse.json(formattedMessage)
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
