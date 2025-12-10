'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePresenceStore } from '@/stores/usePresenceStore'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  isOnline: boolean
  lastSeen: Date
}

// Simple cache outside component
let usersCache: User[] = []

export function useUsers() {
  const [users, setUsers] = useState<User[]>(usersCache)
  const [isLoading, setIsLoading] = useState(usersCache.length === 0)
  const [error, setError] = useState<string | null>(null)
  const { onlineUsers } = usePresenceStore()
  const hasFetched = useRef(false)

  const fetchUsers = useCallback(async (force = false) => {
    // Skip if already have cached data and not forcing refresh
    if (!force && usersCache.length > 0) {
      setUsers(usersCache)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      usersCache = data
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchUsers()
    }
  }, [fetchUsers])

  const usersWithPresence = users.map((user) => ({
    ...user,
    isOnline: onlineUsers[user.id] ?? user.isOnline,
  }))

  const onlineUsersList = usersWithPresence.filter((u) => u.isOnline)
  const offlineUsersList = usersWithPresence.filter((u) => !u.isOnline)

  return {
    users: usersWithPresence,
    onlineUsers: onlineUsersList,
    offlineUsers: offlineUsersList,
    isLoading,
    error,
    refetch: () => fetchUsers(true),
  }
}
