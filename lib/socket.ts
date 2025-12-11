import { Server as SocketIOServer, Socket } from 'socket.io'
import { prisma } from './prisma'

type OnlineUsersMap = Map<string, Set<string>>
type TypingUsersMap = Map<string, Map<string, NodeJS.Timeout>>

const onlineUsers: OnlineUsersMap = new Map()
const typingUsers: TypingUsersMap = new Map()

const TYPING_TIMEOUT = 3000

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.auth.userId as string | undefined

    if (!userId) {
      socket.disconnect()
      return
    }

    handleUserJoin(io, socket, userId)

    socket.on('user:leave', (data: { userId: string }) => {
      handleUserLeave(io, socket, data.userId)
    })

    socket.on('message:send', async (data: {
      sessionId: string
      content: string
      tempId: string
      replyToId?: string
      attachments?: Array<{
        type: string
        url: string
        name: string
        size: number
        mimeType?: string
      }>
    }) => {
      await handleMessageSend(io, socket, userId, data)
    })

    socket.on('message:delivered', async (data: { messageId: string }) => {
      await handleMessageDelivered(io, data.messageId)
    })

    socket.on('message:read', async (data: { sessionId: string; messageIds: string[] }) => {
      await handleMessageRead(io, socket, userId, data)
    })

    socket.on('typing:start', (data: { sessionId: string }) => {
      handleTypingStart(io, socket, userId, data.sessionId)
    })

    socket.on('typing:stop', (data: { sessionId: string }) => {
      handleTypingStop(io, socket, userId, data.sessionId)
    })

    socket.on('session:join', (data: { sessionId: string }) => {
      socket.join(`session:${data.sessionId}`)
    })

    socket.on('session:leave', (data: { sessionId: string }) => {
      socket.leave(`session:${data.sessionId}`)
    })

    socket.on('reaction:add', async (data: { sessionId: string; messageId: string; emoji: string }) => {
      await handleReactionAdd(io, socket, userId, data)
    })

    socket.on('reaction:remove', async (data: { sessionId: string; messageId: string; emoji: string }) => {
      await handleReactionRemove(io, socket, userId, data)
    })

    // Group chat handlers
    socket.on('group:join', (data: { groupId: string }) => {
      socket.join(`group:${data.groupId}`)
    })

    socket.on('group:leave', (data: { groupId: string }) => {
      socket.leave(`group:${data.groupId}`)
    })

    socket.on('group:message:send', async (data: {
      groupId: string
      content: string
      tempId: string
      replyToId?: string
    }) => {
      await handleGroupMessageSend(io, socket, userId, data)
    })

    // Broadcast AI message to other group members (sender broadcasts after receiving)
    socket.on('group:ai:message', (data: {
      groupId: string
      message: {
        id: string
        content: string
        senderId: string | null
        senderName: string | null
        senderImage: string | null
        isAI: boolean
        createdAt: Date
        replyTo?: {
          id: string
          content: string
          senderName: string | null
          isAI: boolean
        } | null
      }
    }) => {
      // Broadcast to all OTHER members in the group (not the sender)
      socket.to(`group:${data.groupId}`).emit('group:message:new', {
        groupId: data.groupId,
        message: data.message,
      })
    })

    // Group message edit - broadcast to all members
    socket.on('group:message:edit', (data: {
      groupId: string
      messageId: string
      content: string
      editedAt: Date
    }) => {
      // Broadcast to all OTHER members in the group
      socket.to(`group:${data.groupId}`).emit('group:message:edited', {
        groupId: data.groupId,
        messageId: data.messageId,
        content: data.content,
        editedAt: data.editedAt,
      })
    })

    // Group message delete for all - broadcast to all members
    socket.on('group:message:delete', (data: {
      groupId: string
      messageId: string
    }) => {
      socket.to(`group:${data.groupId}`).emit('group:message:deleted', {
        groupId: data.groupId,
        messageId: data.messageId,
      })
    })

    // Task events
    socket.on('group:task:created', (data: {
      groupId: string
      task: {
        id: string
        description: string
        assigneeId: string
        assigneeName: string | null
        status: string
        priority: string
        createdAt: Date
      }
    }) => {
      socket.to(`group:${data.groupId}`).emit('group:task:new', data)
    })

    socket.on('group:task:updated', (data: {
      groupId: string
      task: {
        id: string
        status: string
        description?: string
        completedAt?: Date | null
      }
    }) => {
      socket.to(`group:${data.groupId}`).emit('group:task:changed', data)
    })

    socket.on('group:task:completed', (data: {
      groupId: string
      taskId: string
      completedBy: string
      completedByName: string | null
    }) => {
      socket.to(`group:${data.groupId}`).emit('group:task:done', data)
    })

    socket.on('disconnect', () => {
      handleDisconnect(io, socket, userId)
    })
  })
}

function handleUserJoin(io: SocketIOServer, socket: Socket, userId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set())
  }
  onlineUsers.get(userId)!.add(socket.id)

  socket.join(`user:${userId}`)

  updateUserOnlineStatus(userId, true)

  io.emit('user:online', { userId })

  const onlineUserIds = Array.from(onlineUsers.keys())
  socket.emit('users:list', { users: onlineUserIds })
}

function handleUserLeave(io: SocketIOServer, socket: Socket, userId: string) {
  const userSockets = onlineUsers.get(userId)

  if (userSockets) {
    userSockets.delete(socket.id)

    if (userSockets.size === 0) {
      onlineUsers.delete(userId)
      const lastSeen = new Date()

      updateUserOnlineStatus(userId, false, lastSeen)

      io.emit('user:offline', { userId, lastSeen })
    }
  }

  socket.leave(`user:${userId}`)
}

async function handleMessageSend(
  io: SocketIOServer,
  socket: Socket,
  senderId: string,
  data: {
    sessionId: string
    content: string
    tempId: string
    replyToId?: string
    attachments?: Array<{
      type: string
      url: string
      name: string
      size: number
      mimeType?: string
    }>
  }
) {
  try {
    const message = await prisma.message.create({
      data: {
        content: data.content,
        senderId,
        sessionId: data.sessionId,
        replyToId: data.replyToId,
        attachments: data.attachments
          ? {
              create: data.attachments.map((att) => ({
                type: att.type,
                url: att.url,
                name: att.name,
                size: att.size,
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        attachments: true,
        reactions: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    await prisma.chatSession.update({
      where: { id: data.sessionId },
      data: { updatedAt: new Date() },
    })

    const session = await prisma.chatSession.findUnique({
      where: { id: data.sessionId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    })

    if (session) {
      const recipientIds = session.participants
        .map((p) => p.id)
        .filter((id) => id !== senderId)

      socket.emit('message:confirm', {
        sessionId: data.sessionId,
        tempId: data.tempId,
        message,
      })

      recipientIds.forEach((recipientId) => {
        const isOnline = onlineUsers.has(recipientId)

        io.to(`user:${recipientId}`).emit('message:new', {
          sessionId: data.sessionId,
          message,
        })

        if (isOnline) {
          prisma.message
            .update({
              where: { id: message.id },
              data: { delivered: true },
            })
            .then(() => {
              io.to(`user:${senderId}`).emit('message:delivered', {
                messageId: message.id,
                deliveredAt: new Date(),
              })
            })
            .catch(() => {})
        }
      })
    }
  } catch {
    socket.emit('error', { message: 'Failed to send message' })
  }
}

async function handleMessageDelivered(io: SocketIOServer, messageId: string) {
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { delivered: true },
    })

    io.to(`user:${message.senderId}`).emit('message:delivered', {
      messageId,
      deliveredAt: new Date(),
    })
  } catch {}
}

async function handleMessageRead(
  io: SocketIOServer,
  _socket: Socket,
  userId: string,
  data: { sessionId: string; messageIds: string[] }
) {
  try {
    await prisma.message.updateMany({
      where: {
        id: { in: data.messageIds },
        senderId: { not: userId },
      },
      data: { read: true },
    })

    const messages = await prisma.message.findMany({
      where: { id: { in: data.messageIds } },
      select: { senderId: true },
    })

    const senderIds = [...new Set(messages.map((m) => m.senderId))]

    senderIds.forEach((senderId) => {
      if (senderId !== userId) {
        io.to(`user:${senderId}`).emit('message:read', {
          messageIds: data.messageIds,
          readAt: new Date(),
        })
      }
    })
  } catch {}
}

function handleTypingStart(
  io: SocketIOServer,
  socket: Socket,
  userId: string,
  sessionId: string
) {
  if (!typingUsers.has(sessionId)) {
    typingUsers.set(sessionId, new Map())
  }

  const sessionTyping = typingUsers.get(sessionId)!

  const existingTimeout = sessionTyping.get(userId)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  const timeout = setTimeout(() => {
    handleTypingStop(io, socket, userId, sessionId)
  }, TYPING_TIMEOUT)

  sessionTyping.set(userId, timeout)

  socket.to(`session:${sessionId}`).emit('typing:indicator', {
    sessionId,
    userId,
    isTyping: true,
  })
}

function handleTypingStop(
  _io: SocketIOServer,
  socket: Socket,
  userId: string,
  sessionId: string
) {
  const sessionTyping = typingUsers.get(sessionId)

  if (sessionTyping) {
    const timeout = sessionTyping.get(userId)
    if (timeout) {
      clearTimeout(timeout)
    }
    sessionTyping.delete(userId)

    if (sessionTyping.size === 0) {
      typingUsers.delete(sessionId)
    }
  }

  socket.to(`session:${sessionId}`).emit('typing:indicator', {
    sessionId,
    userId,
    isTyping: false,
  })
}

function handleDisconnect(io: SocketIOServer, socket: Socket, userId: string) {
  const userSockets = onlineUsers.get(userId)

  if (userSockets) {
    userSockets.delete(socket.id)

    if (userSockets.size === 0) {
      onlineUsers.delete(userId)
      const lastSeen = new Date()

      updateUserOnlineStatus(userId, false, lastSeen)

      io.emit('user:offline', { userId, lastSeen })
    }
  }

  typingUsers.forEach((sessionTyping, sessionId) => {
    const timeout = sessionTyping.get(userId)
    if (timeout) {
      clearTimeout(timeout)
      sessionTyping.delete(userId)

      io.to(`session:${sessionId}`).emit('typing:indicator', {
        sessionId,
        userId,
        isTyping: false,
      })
    }
  })
}

async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean,
  lastSeen?: Date
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: lastSeen || new Date(),
      },
    })
  } catch {}
}

async function handleReactionAdd(
  io: SocketIOServer,
  _socket: Socket,
  userId: string,
  data: { sessionId: string; messageId: string; emoji: string }
) {
  try {
    const existing = await prisma.reaction.findFirst({
      where: {
        messageId: data.messageId,
        userId,
        emoji: data.emoji,
      },
    })

    if (existing) return

    const reaction = await prisma.reaction.create({
      data: {
        emoji: data.emoji,
        userId,
        messageId: data.messageId,
      },
    })

    io.to(`session:${data.sessionId}`).emit('reaction:added', {
      sessionId: data.sessionId,
      messageId: data.messageId,
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        messageId: reaction.messageId,
        createdAt: reaction.createdAt,
      },
    })
  } catch {}
}

async function handleReactionRemove(
  io: SocketIOServer,
  _socket: Socket,
  userId: string,
  data: { sessionId: string; messageId: string; emoji: string }
) {
  try {
    await prisma.reaction.deleteMany({
      where: {
        messageId: data.messageId,
        userId,
        emoji: data.emoji,
      },
    })

    io.to(`session:${data.sessionId}`).emit('reaction:removed', {
      sessionId: data.sessionId,
      messageId: data.messageId,
      emoji: data.emoji,
      userId,
    })
  } catch {}
}

// Group message handler
async function handleGroupMessageSend(
  io: SocketIOServer,
  socket: Socket,
  senderId: string,
  data: {
    groupId: string
    content: string
    tempId: string
    replyToId?: string
  }
) {
  try {
    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: senderId } },
    })

    if (!membership) {
      socket.emit('error', { message: 'Not a member of this group' })
      return
    }

    // Create message with optional reply
    const message = await prisma.groupMessage.create({
      data: {
        groupId: data.groupId,
        senderId,
        content: data.content,
        isAI: false,
        replyToId: data.replyToId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
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

    // Update group's updatedAt
    await prisma.group.update({
      where: { id: data.groupId },
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
            senderName: message.replyTo.isAI
              ? 'Shipper'
              : message.replyTo.sender?.name || 'Unknown',
            isAI: message.replyTo.isAI,
          }
        : null,
    }

    // Confirm to sender
    socket.emit('group:message:confirm', {
      groupId: data.groupId,
      tempId: data.tempId,
      message: formattedMessage,
    })

    // Broadcast to all other members in the group room
    socket.to(`group:${data.groupId}`).emit('group:message:new', {
      groupId: data.groupId,
      message: formattedMessage,
    })
  } catch (error) {
    console.error('Group message error:', error)
    socket.emit('error', { message: 'Failed to send group message' })
  }
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys())
}

// Export io instance for use in API routes (for AI responses)
let ioInstance: SocketIOServer | null = null

export function setIOInstance(io: SocketIOServer) {
  ioInstance = io
}

export function getIOInstance(): SocketIOServer | null {
  return ioInstance
}

export function emitToGroup(groupId: string, event: string, data: unknown) {
  if (ioInstance) {
    ioInstance.to(`group:${groupId}`).emit(event, data)
  }
}
