'use client'

import { useCallback } from 'react'
import { useSocketStore } from '@/stores/useSocketStore'
import { useChatStore } from '@/stores/useChatStore'

export function useSocket() {
  const { socket, isConnected } = useSocketStore()
  const { activeSessionId } = useChatStore()

  const sendMessage = useCallback(
    (sessionId: string, content: string, tempId: string) => {
      if (!socket || !isConnected) return false
      socket.emit('message:send', { sessionId, content, tempId })
      return true
    },
    [socket, isConnected]
  )

  const joinSession = useCallback(
    (sessionId: string) => {
      if (!socket || !isConnected) return
      socket.emit('session:join', { sessionId })
    },
    [socket, isConnected]
  )

  const leaveSession = useCallback(
    (sessionId: string) => {
      if (!socket || !isConnected) return
      socket.emit('session:leave', { sessionId })
    },
    [socket, isConnected]
  )

  const startTyping = useCallback(
    (sessionId: string) => {
      if (!socket || !isConnected) return
      socket.emit('typing:start', { sessionId })
    },
    [socket, isConnected]
  )

  const stopTyping = useCallback(
    (sessionId: string) => {
      if (!socket || !isConnected) return
      socket.emit('typing:stop', { sessionId })
    },
    [socket, isConnected]
  )

  return {
    socket,
    isConnected,
    sendMessage,
    joinSession,
    leaveSession,
    startTyping,
    stopTyping,
    activeSessionId,
  }
}
