'use client'

import { use, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { OnlineIndicator } from '@/components/chat/OnlineIndicator'
import { useMessages } from '@/lib/queries'
import { useSocketStore } from '@/stores/useSocketStore'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { useChatStore } from '@/stores/useChatStore'
import { getInitials } from '@/lib/utils'

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = use(params)
  const { data: authSession } = useSession()
  const { socket, isConnected } = useSocketStore()
  const { onlineUsers, getTypingUsers } = usePresenceStore()
  const { setActiveSession, markAsRead, addReaction, removeReaction } = useChatStore()
  const lastReadRef = useRef<Set<string>>(new Set())

  const {
    messages,
    sessionData,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
  } = useMessages(sessionId)

  useEffect(() => {
    setActiveSession(sessionId)
    markAsRead(sessionId)

    if (socket && isConnected) {
      socket.emit('session:join', { sessionId })
    }

    return () => {
      setActiveSession(null)
      if (socket && isConnected) {
        socket.emit('session:leave', { sessionId })
      }
    }
  }, [sessionId, setActiveSession, markAsRead, socket, isConnected])

  useEffect(() => {
    if (!socket || !isConnected || !authSession?.user?.id) return

    const unreadMessageIds = messages
      .filter(
        (m) =>
          m.senderId !== authSession.user.id &&
          m.status !== 'read' &&
          !lastReadRef.current.has(m.id)
      )
      .map((m) => m.id)

    if (unreadMessageIds.length > 0) {
      socket.emit('message:read', { sessionId, messageIds: unreadMessageIds })
      unreadMessageIds.forEach((id) => lastReadRef.current.add(id))
    }
  }, [messages, socket, isConnected, sessionId, authSession?.user?.id])

  const handleTypingStart = () => {
    if (socket && isConnected) {
      socket.emit('typing:start', { sessionId })
    }
  }

  const handleTypingStop = () => {
    if (socket && isConnected) {
      socket.emit('typing:stop', { sessionId })
    }
  }

  const handleSendMessage = useCallback((content: string, replyToId?: string) => {
    sendMessage(content, replyToId)
  }, [sendMessage])

  const handleReact = useCallback((messageId: string, emoji: string) => {
    const userId = authSession?.user?.id
    if (!socket || !isConnected || !userId) return

    const message = messages.find((m) => m.id === messageId)
    const hasOwnReaction = message?.reactions?.some(
      (r) => r.emoji === emoji && r.userId === userId
    )

    if (hasOwnReaction) {
      removeReaction(sessionId, messageId, emoji, userId)
      socket.emit('reaction:remove', { sessionId, messageId, emoji })
    } else {
      addReaction(sessionId, messageId, emoji, userId)
      socket.emit('reaction:add', { sessionId, messageId, emoji })
    }
  }, [socket, isConnected, authSession, messages, sessionId, addReaction, removeReaction])

  const participant = sessionData?.participant
  const isOnline = participant ? (onlineUsers[participant.id] ?? participant.isOnline) : false
  const typingUsers = getTypingUsers(sessionId)

  return (
    <div className="flex flex-col h-full pb-14 md:pb-0">
      <header className="shrink-0 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {participant && (
            <>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.image || ''} alt={participant.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <OnlineIndicator isOnline={isOnline} className="absolute bottom-0 right-0" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-medium truncate">{participant.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </>
          )}

          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <MessageList
        messages={messages}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onReact={handleReact}
        sessionId={sessionId}
      />

      {typingUsers.length > 0 && (
        <TypingIndicator userName={participant?.name || undefined} />
      )}

      <div className="shrink-0">
        <MessageInput
          onSend={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={!sessionData}
        />
      </div>
    </div>
  )
}
