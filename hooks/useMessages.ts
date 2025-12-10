'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/stores/useChatStore'
import { useSocket } from './useSocket'
import type { MessageWithStatus } from '@/types'

interface SessionParticipant {
  id: string
  name: string | null
  image: string | null
  isOnline: boolean
  lastSeen: Date
}

interface SessionData {
  session: {
    id: string
    participant: SessionParticipant
  }
  messages: MessageWithStatus[]
  nextCursor: string | null
  hasMore: boolean
}

// Cache for session data (participant info)
const sessionDataCache: Record<string, SessionData['session']> = {}

export function useMessages(sessionId: string) {
  const { data: authSession } = useSession()
  const {
    messages,
    setMessages,
    addMessage,
    prependMessages,
    replaceMessageByTempId,
    updateMessageStatus,
    hasMoreMessages,
    setHasMore,
    isLoadingMessages,
    setLoadingMessages,
  } = useChatStore()

  const { sendMessage: socketSend, isConnected } = useSocket()
  const cachedSessionData = sessionDataCache[sessionId]
  const existingMessages = messages[sessionId]
  
  const [sessionData, setSessionData] = useState<SessionData['session'] | null>(cachedSessionData || null)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const initialLoadDone = useRef(existingMessages?.length > 0)
  const hasFetched = useRef(false)

  const fetchMessages = useCallback(
    async (cursor?: string, force = false) => {
      // Skip initial fetch if we already have messages (unless forcing)
      if (!cursor && !force && existingMessages?.length > 0) {
        setLoadingMessages(false)
        initialLoadDone.current = true
        return
      }

      try {
        setLoadingMessages(true)
        const url = cursor
          ? `/api/chat/sessions/${sessionId}?cursor=${cursor}`
          : `/api/chat/sessions/${sessionId}`

        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch messages')

        const data: SessionData = await res.json()

        if (cursor) {
          prependMessages(sessionId, data.messages)
        } else {
          setMessages(sessionId, data.messages)
          setSessionData(data.session)
          sessionDataCache[sessionId] = data.session
        }

        setHasMore(sessionId, data.hasMore)
        cursorRef.current = data.nextCursor
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages')
      } finally {
        setLoadingMessages(false)
        initialLoadDone.current = true
      }
    },
    [sessionId, existingMessages?.length, setMessages, prependMessages, setHasMore, setLoadingMessages]
  )

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchMessages()
    }
  }, [fetchMessages])

  const loadMore = useCallback(() => {
    if (!hasMoreMessages[sessionId] || isLoadingMessages || !cursorRef.current) return
    fetchMessages(cursorRef.current)
  }, [sessionId, hasMoreMessages, isLoadingMessages, fetchMessages])

  const sendMessage = useCallback(
    async (content: string) => {
      const userId = authSession?.user?.id || ''
      const userName = authSession?.user?.name || null
      const userImage = authSession?.user?.image || null
      
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const tempMessage: MessageWithStatus = {
        id: tempId,
        tempId,
        content,
        senderId: userId,
        sessionId,
        createdAt: new Date(),
        sender: { id: userId, name: userName, image: userImage },
        status: 'sending',
      }

      addMessage(sessionId, tempMessage)

      if (isConnected) {
        socketSend(sessionId, content, tempId)
      } else {
        try {
          const res = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, content }),
          })

          if (!res.ok) throw new Error('Failed to send message')
          const data = await res.json()
          replaceMessageByTempId(sessionId, tempId, { ...data, status: 'sent' })
        } catch {
          updateMessageStatus(sessionId, tempId, 'failed')
        }
      }
    },
    [sessionId, authSession, isConnected, socketSend, addMessage, replaceMessageByTempId, updateMessageStatus]
  )

  return {
    messages: messages[sessionId] || [],
    sessionData,
    isLoading: isLoadingMessages && !initialLoadDone.current,
    isLoadingMore: isLoadingMessages && initialLoadDone.current,
    hasMore: hasMoreMessages[sessionId] ?? true,
    error,
    fetchMessages: (cursor?: string) => fetchMessages(cursor, true),
    loadMore,
    sendMessage,
  }
}
