'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { MessageBubble } from './MessageBubble'
import { MessageActions } from './MessageActions'
import { useChatStore } from '@/stores/useChatStore'
import { Loader2 } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  userId: string
  messageId: string
  createdAt: Date
}

interface ReplyTo {
  id: string
  content: string
  sender?: { name: string | null }
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date
  sender?: { id: string; name: string | null; image: string | null }
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'failed'
  reactions?: Reaction[]
  replyTo?: ReplyTo | null
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onReact?: (messageId: string, emoji: string) => void
  sessionId: string
}

export function MessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onReact,
  sessionId: _sessionId,
}: MessageListProps) {
  const { data: session } = useSession()
  const { setReplyingTo } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)
  const prevMessageCount = useRef(0)
  const isNearBottom = useRef(true)
  const newMessageIds = useRef<Set<string>>(new Set())

  const lastOwnMessageId = useMemo(() => {
    const ownMessages = messages.filter((m) => m.senderId === session?.user?.id)
    return ownMessages[ownMessages.length - 1]?.id
  }, [messages, session?.user?.id])

  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('bg-primary/10')
      setTimeout(() => element.classList.remove('bg-primary/10'), 2000)
    }
  }, [])

  const checkIfNearBottom = useCallback(() => {
    if (!scrollRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    return scrollHeight - scrollTop - clientHeight < 150
  }, [])

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom(false)
      isInitialLoad.current = false
      prevMessageCount.current = messages.length
    }
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (isInitialLoad.current || isLoadingMore) return
    if (messages.length <= prevMessageCount.current) {
      prevMessageCount.current = messages.length
      return
    }

    // Track new messages for animation
    const newMessages = messages.slice(prevMessageCount.current)
    newMessages.forEach((m) => newMessageIds.current.add(m.id))
    
    // Clear animation after it plays
    setTimeout(() => {
      newMessages.forEach((m) => newMessageIds.current.delete(m.id))
    }, 500)

    const lastMessage = messages[messages.length - 1]
    const isOwnMessage = lastMessage?.senderId === session?.user?.id

    if (isOwnMessage || isNearBottom.current) {
      scrollToBottom(true)
    }

    prevMessageCount.current = messages.length
  }, [messages, isLoadingMore, session?.user?.id, scrollToBottom])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    isNearBottom.current = checkIfNearBottom()

    if (hasMore && !isLoadingMore && scrollRef.current.scrollTop < 100) {
      onLoadMore?.()
    }
  }, [hasMore, isLoadingMore, onLoadMore, checkIfNearBottom])

  const handleReply = useCallback((message: Message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      senderName: message.sender?.name || null,
    })
  }, [setReplyingTo])

  const handleReact = useCallback((messageId: string, emoji: string) => {
    onReact?.(messageId, emoji)
  }, [onReact])

  const handleDoubleClick = useCallback((messageId: string) => {
    onReact?.(messageId, '❤️')
  }, [onReact])

  const aggregateReactions = useCallback((reactions: Reaction[] = []) => {
    const map = new Map<string, { count: number; hasOwn: boolean }>()
    
    reactions.forEach((r) => {
      const existing = map.get(r.emoji) || { count: 0, hasOwn: false }
      map.set(r.emoji, {
        count: existing.count + 1,
        hasOwn: existing.hasOwn || r.userId === session?.user?.id,
      })
    })

    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasOwn: data.hasOwn,
    }))
  }, [session?.user?.id])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto p-4">
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {messages.map((message, index) => {
          const isOwn = message.senderId === session?.user?.id
          const prevMessage = messages[index - 1]
          const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
          const isLastOwn = message.id === lastOwnMessageId
          const isNew = newMessageIds.current.has(message.id)

          return (
            <div 
              key={message.id} 
              id={`message-${message.id}`} 
              className={`transition-colors rounded-lg ${isNew ? 'animate-message-in' : ''}`}
            >
              <MessageActions
                messageId={message.id}
                isOwn={isOwn}
                onReply={() => handleReply(message)}
                onReact={(emoji) => handleReact(message.id, emoji)}
              >
                <MessageBubble
                  content={message.content}
                  senderName={message.sender?.name || null}
                  senderImage={message.sender?.image || null}
                  createdAt={message.createdAt}
                  isOwn={isOwn}
                  status={message.status}
                  showAvatar={showAvatar}
                  isLastOwn={isLastOwn}
                  replyTo={message.replyTo ? {
                    id: message.replyTo.id,
                    content: message.replyTo.content,
                    senderName: message.replyTo.sender?.name || null,
                  } : null}
                  reactions={aggregateReactions(message.reactions)}
                  onReactionClick={(emoji) => handleReact(message.id, emoji)}
                  onReplyClick={() => message.replyTo && scrollToMessage(message.replyTo.id)}
                  onDoubleClick={() => handleDoubleClick(message.id)}
                />
              </MessageActions>
            </div>
          )
        })}
      </div>
    </div>
  )
}
