import { useQuery } from '@tanstack/react-query'
import { usersApi, type User } from '@/lib/api/users'
import { queryKeys } from './keys'
import { usePresenceStore } from '@/stores/usePresenceStore'

export function useUsers() {
  const { onlineUsers } = usePresenceStore()

  const query = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.getAll,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const usersWithPresence = (query.data || []).map((user) => ({
    ...user,
    isOnline: onlineUsers[user.id] ?? user.isOnline,
  }))

  const onlineUsersList = usersWithPresence.filter((u) => u.isOnline)
  const offlineUsersList = usersWithPresence.filter((u) => !u.isOnline)

  return {
    users: usersWithPresence,
    onlineUsers: onlineUsersList,
    offlineUsers: offlineUsersList,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  }
}

export type { User }
