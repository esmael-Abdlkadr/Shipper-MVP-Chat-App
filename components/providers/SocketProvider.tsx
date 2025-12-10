'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSocketStore } from '@/stores/useSocketStore'
import { useChatStore } from '@/stores/useChatStore'
import { usePresenceStore } from '@/stores/usePresenceStore'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { socket, isConnected, connect, disconnect } = useSocketStore()
  const {
    addMessage,
    updateSession,
    replaceMessageByTempId,
    incrementUnread,
    activeSessionId,
    updateMessageStatus,
    updateMultipleMessagesStatus,
    addReaction,
    removeReaction,
  } = useChatStore()
  const { setUserOnline, setUserOffline, setTyping } = usePresenceStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !initialized.current) {
      initialized.current = true
      connect(session.user.id)
    }

    return () => {
      if (initialized.current) {
        disconnect()
        initialized.current = false
      }
    }
  }, [status, session?.user?.id, connect, disconnect])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { sessionId: string; message: Parameters<typeof addMessage>[1] }) => {
      if (!data?.message?.id) return

      addMessage(data.sessionId, { ...data.message, status: 'delivered' })
      updateSession(data.sessionId, {
        updatedAt: new Date(),
        lastMessage: {
          content: data.message.content,
          createdAt: String(data.message.createdAt),
          senderId: data.message.senderId,
        },
      })

      if (data.sessionId !== activeSessionId) {
        incrementUnread(data.sessionId)
        playNotificationSound()
      }
    }

    const handleMessageConfirm = (data: {
      sessionId: string
      tempId: string
      message: Parameters<typeof replaceMessageByTempId>[2]
    }) => {
      if (!data?.message?.id || !data?.tempId) return

      replaceMessageByTempId(data.sessionId, data.tempId, { ...data.message, status: 'sent' })
      updateSession(data.sessionId, {
        updatedAt: new Date(),
        lastMessage: {
          content: data.message.content,
          createdAt: String(data.message.createdAt),
          senderId: data.message.senderId,
        },
      })
    }

    const handleMessageDelivered = (data: { messageId: string }) => {
      const messages = useChatStore.getState().messages
      for (const sessionId in messages) {
        const found = messages[sessionId].find((m) => m.id === data.messageId)
        if (found) {
          updateMessageStatus(sessionId, data.messageId, 'delivered')
          break
        }
      }
    }

    const handleMessageRead = (data: { messageIds: string[] }) => {
      const messages = useChatStore.getState().messages
      for (const sessionId in messages) {
        const hasAny = messages[sessionId].some((m) => data.messageIds.includes(m.id))
        if (hasAny) {
          updateMultipleMessagesStatus(sessionId, data.messageIds, 'read')
          break
        }
      }
    }

    const handleReactionAdded = (data: {
      sessionId: string
      messageId: string
      reaction: { id: string; emoji: string; userId: string; messageId: string; createdAt: Date }
    }) => {
      addReaction(data.sessionId, data.messageId, data.reaction.emoji, data.reaction.userId)
    }

    const handleReactionRemoved = (data: {
      sessionId: string
      messageId: string
      emoji: string
      userId: string
    }) => {
      removeReaction(data.sessionId, data.messageId, data.emoji, data.userId)
    }

    const handleUserOnline = (data: { userId: string }) => {
      setUserOnline(data.userId)
    }

    const handleUserOffline = (data: { userId: string; lastSeen: string }) => {
      setUserOffline(data.userId, new Date(data.lastSeen))
    }

    const handleTyping = (data: { sessionId: string; userId: string; isTyping: boolean }) => {
      setTyping(data.sessionId, data.userId, data.isTyping)
    }

    socket.on('message:new', handleNewMessage)
    socket.on('message:confirm', handleMessageConfirm)
    socket.on('message:delivered', handleMessageDelivered)
    socket.on('message:read', handleMessageRead)
    socket.on('reaction:added', handleReactionAdded)
    socket.on('reaction:removed', handleReactionRemoved)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('typing:indicator', handleTyping)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('message:confirm', handleMessageConfirm)
      socket.off('message:delivered', handleMessageDelivered)
      socket.off('message:read', handleMessageRead)
      socket.off('reaction:added', handleReactionAdded)
      socket.off('reaction:removed', handleReactionRemoved)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('typing:indicator', handleTyping)
    }
  }, [
    socket,
    addMessage,
    updateSession,
    replaceMessageByTempId,
    incrementUnread,
    activeSessionId,
    updateMessageStatus,
    updateMultipleMessagesStatus,
    addReaction,
    removeReaction,
    setUserOnline,
    setUserOffline,
    setTyping,
  ])

  return <>{children}</>
}

function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 1.0
    audio.play().catch(() => {})
  } catch {}
}
