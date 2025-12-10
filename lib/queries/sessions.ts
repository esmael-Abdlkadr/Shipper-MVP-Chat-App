import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/useChatStore'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { sessionsApi, type ChatSession } from '@/lib/api/sessions'

export function useSessions() {
  const { sessions, setSessions, unreadCounts } = useChatStore()
  const { onlineUsers } = usePresenceStore()
  const [isLoading, setIsLoading] = useState(sessions.length === 0)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchSessions = useCallback(async (force = false) => {
    if (!force && sessions.length > 0) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await sessionsApi.getAll()
      setSessions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setIsLoading(false)
    }
  }, [sessions.length, setSessions])

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchSessions()
    }
  }, [fetchSessions])

  const sessionsWithPresence = sessions.map((session) => ({
    ...session,
    participant: session.participant
      ? {
          ...session.participant,
          isOnline: onlineUsers[session.participant.id] ?? session.participant.isOnline,
        }
      : null,
    unreadCount: unreadCounts[session.id] || 0,
  }))

  return {
    sessions: sessionsWithPresence,
    isLoading,
    error,
    refetch: () => fetchSessions(true),
  }
}

export function useCreateSession() {
  const router = useRouter()
  const { setSessions } = useChatStore()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (participantId: string) => {
    try {
      setIsCreating(true)
      const data = await sessionsApi.create(participantId)
      
      if (!data.existing) {
        const freshData = await sessionsApi.getAll()
        setSessions(freshData)
      }
      
      router.push(`/chat/${data.id}`)
      return data.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      return null
    } finally {
      setIsCreating(false)
    }
  }, [router, setSessions])

  return {
    createSession,
    isCreating,
    error,
  }
}

export type { ChatSession }
