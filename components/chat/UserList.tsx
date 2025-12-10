'use client'

import { Users, Loader2 } from 'lucide-react'
import { UserListItem } from './UserListItem'
import { useUsers } from '@/lib/queries'

interface UserListProps {
  onStartChat?: (userId: string) => void
}

export function UserList({ onStartChat }: UserListProps) {
  const { onlineUsers, offlineUsers, isLoading, error } = useUsers()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (onlineUsers.length === 0 && offlineUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No users found</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          There are no other users registered yet.
        </p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-4">
      {onlineUsers.length > 0 && (
        <section>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Online — {onlineUsers.length}
          </h4>
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <UserListItem
                key={user.id}
                id={user.id}
                name={user.name || 'Unknown'}
                email={user.email}
                image={user.image}
                isOnline
                onStartChat={onStartChat}
              />
            ))}
          </div>
        </section>
      )}

      {offlineUsers.length > 0 && (
        <section>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Offline — {offlineUsers.length}
          </h4>
          <div className="space-y-1">
            {offlineUsers.map((user) => (
              <UserListItem
                key={user.id}
                id={user.id}
                name={user.name || 'Unknown'}
                email={user.email}
                image={user.image}
                isOnline={false}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
