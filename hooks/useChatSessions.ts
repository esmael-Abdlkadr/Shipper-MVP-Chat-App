'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/useChatStore'

export function useChatSessions() {
  const router = useRouter()
  const { sessions, setSessions } = useChatStore()
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
      const res = await fetch('/api/chat/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
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

  const createSession = useCallback(
    async (participantId: string) => {
      try {
        const res = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId }),
        })

        if (!res.ok) throw new Error('Failed to create session')
        const data = await res.json()

        if (!data.existing) {
          await fetchSessions(true)
        }

        router.push(`/chat/${data.id}`)
        return data.id
      } catch {
        return null
      }
    },
    [router, fetchSessions]
  )

  return {
    sessions,
    isLoading,
    error,
    refetch: () => fetchSessions(true),
    createSession,
  }
}
