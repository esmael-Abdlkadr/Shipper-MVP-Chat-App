import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string; messageId: string }> }

const EDIT_TIME_LIMIT_MS = 48 * 60 * 60 * 1000

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, messageId } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 })
    }

    if (message.isAI) {
      return NextResponse.json({ error: 'Cannot edit AI messages' }, { status: 403 })
    }

    const timeSinceCreation = Date.now() - message.createdAt.getTime()
    if (timeSinceCreation > EDIT_TIME_LIMIT_MS) {
      return NextResponse.json({ error: 'Cannot edit messages older than 48 hours' }, { status: 403 })
    }

    const updatedMessage = await prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
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
            sender: { select: { name: true } },
          },
        },
      },
    })

    const formattedMessage = {
      id: updatedMessage.id,
      content: updatedMessage.content,
      senderId: updatedMessage.senderId,
      senderName: updatedMessage.sender?.name || 'Unknown',
      senderImage: updatedMessage.sender?.image || null,
      isAI: updatedMessage.isAI,
      createdAt: updatedMessage.createdAt,
      editedAt: updatedMessage.editedAt,
      replyTo: updatedMessage.replyTo
        ? {
            id: updatedMessage.replyTo.id,
            content: updatedMessage.replyTo.content,
            senderName: updatedMessage.replyTo.isAI
              ? 'Shipper'
              : updatedMessage.replyTo.sender?.name || 'Unknown',
            isAI: updatedMessage.replyTo.isAI,
          }
        : null,
    }

    return NextResponse.json(formattedMessage)
  } catch {
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, messageId } = await params
    const searchParams = request.nextUrl.searchParams
    const deleteType = searchParams.get('type') || 'forMe'

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (deleteType === 'forAll') {
      if (message.senderId !== session.user.id) {
        return NextResponse.json({ error: 'Can only delete your own messages for all' }, { status: 403 })
      }

      if (message.isAI) {
        return NextResponse.json({ error: 'Cannot delete AI messages for all' }, { status: 403 })
      }

      const timeSinceCreation = Date.now() - message.createdAt.getTime()
      if (timeSinceCreation > EDIT_TIME_LIMIT_MS) {
        return NextResponse.json({ error: 'Cannot delete messages older than 48 hours for all' }, { status: 403 })
      }

      await prisma.groupMessage.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          content: '',
        },
      })

      return NextResponse.json({ success: true, type: 'forAll', messageId })
    } else {
      const updatedDeletedForUsers = [...(message.deletedForUsers || []), session.user.id]
      
      await prisma.groupMessage.update({
        where: { id: messageId },
        data: { deletedForUsers: updatedDeletedForUsers },
      })

      return NextResponse.json({ success: true, type: 'forMe', messageId })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
