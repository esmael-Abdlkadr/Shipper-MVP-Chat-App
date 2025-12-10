'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { ChatListItem } from './ChatListItem'
import { useSessions } from '@/lib/queries'

export function ChatList() {
  const pathname = usePathname()
  const activeSessionId = pathname.split('/chat/')[1]
  const { sessions, isLoading, error } = useSessions()

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

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Start chatting with someone from the Users tab.
        </p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {sessions.map((session) => {
        const participant = session.participant
        if (!participant) return null

        return (
          <ChatListItem
            key={session.id}
            id={session.id}
            name={participant.name || 'Unknown'}
            image={participant.image}
            lastMessage={session.lastMessage?.content}
            lastMessageAt={session.lastMessage?.createdAt}
            unreadCount={session.unreadCount}
            isOnline={participant.isOnline}
            isActive={activeSessionId === session.id}
          />
        )
      })}
    </div>
  )
}
