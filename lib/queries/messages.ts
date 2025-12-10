import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/stores/useChatStore'
import { useSocketStore } from '@/stores/useSocketStore'
import { messagesApi } from '@/lib/api/messages'
import type { MessageWithStatus } from '@/types'

export function useMessages(sessionId: string) {
  const { data: authSession } = useSession()
  const { socket, isConnected } = useSocketStore()
  const {
    messages: storeMessages,
    setMessages,
    addMessage,
    replaceMessageByTempId,
    updateMessageStatus,
    hasMoreMessages,
    setHasMore,
  } = useChatStore()

  const [sessionData, setSessionData] = useState<{
    id: string
    participant: {
      id: string
      name: string | null
      image: string | null
      isOnline: boolean
      lastSeen: string
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const cursorRef = useRef<string | null>(null)
  const hasFetched = useRef(false)

  const messages = storeMessages[sessionId] || []
  const hasMore = hasMoreMessages[sessionId] ?? true

  const fetchMessages = useCallback(async () => {
    if (hasFetched.current && messages.length > 0) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await messagesApi.getBySession(sessionId)
      setMessages(sessionId, data.messages)
      setSessionData(data.session)
      setHasMore(sessionId, data.hasMore)
      cursorRef.current = data.nextCursor
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setIsLoading(false)
      hasFetched.current = true
    }
  }, [sessionId, messages.length, setMessages, setHasMore])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursorRef.current) return

    try {
      const data = await messagesApi.getBySession(sessionId, cursorRef.current)
      const currentMessages = storeMessages[sessionId] || []
      setMessages(sessionId, [...data.messages, ...currentMessages])
      setHasMore(sessionId, data.hasMore)
      cursorRef.current = data.nextCursor
    } catch {}
  }, [sessionId, hasMore, storeMessages, setMessages, setHasMore])

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    const userId = authSession?.user?.id || ''
    const userName = authSession?.user?.name || null
    const userImage = authSession?.user?.image || null

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const replyTo = replyToId
      ? messages.find((m) => m.id === replyToId)
      : null

    const tempMessage: MessageWithStatus = {
      id: tempId,
      tempId,
      content,
      senderId: userId,
      sessionId,
      createdAt: new Date(),
      sender: { id: userId, name: userName, image: userImage },
      status: 'sending',
      replyToId,
      replyTo: replyTo || undefined,
    }

    addMessage(sessionId, tempMessage)

    if (socket && isConnected) {
      socket.emit('message:send', { sessionId, content, tempId, replyToId })
    } else {
      try {
        const data = await messagesApi.send({ sessionId, content })
        replaceMessageByTempId(sessionId, tempId, { ...data, status: 'sent' })
      } catch {
        updateMessageStatus(sessionId, tempId, 'failed')
      }
    }
  }, [sessionId, authSession, socket, isConnected, messages, addMessage, replaceMessageByTempId, updateMessageStatus])

  return {
    messages,
    sessionData,
    isLoading: isLoading && messages.length === 0,
    hasMore,
    error,
    loadMore,
    sendMessage,
    refetch: fetchMessages,
  }
}
