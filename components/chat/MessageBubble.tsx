'use client'

import { useRef, useCallback, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'
import { Check, CheckCheck, AlertCircle, Clock, Heart } from 'lucide-react'

interface ReplyTo {
  id: string
  content: string
  senderName: string | null
}

interface Reaction {
  emoji: string
  count: number
  hasOwn: boolean
}

interface MessageBubbleProps {
  content: string
  senderName: string | null
  senderImage: string | null
  createdAt: Date
  isOwn: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'failed'
  showAvatar?: boolean
  isLastOwn?: boolean
  replyTo?: ReplyTo | null
  reactions?: Reaction[]
  onReactionClick?: (emoji: string) => void
  onReplyClick?: () => void
  onDoubleClick?: () => void
}

const statusConfig = {
  sending: { icon: Clock, text: 'Sending', className: 'text-muted-foreground' },
  sent: { icon: Check, text: 'Sent', className: 'text-muted-foreground' },
  delivered: { icon: CheckCheck, text: 'Delivered', className: 'text-muted-foreground' },
  read: { icon: CheckCheck, text: 'Seen', className: 'text-blue-500' },
  error: { icon: AlertCircle, text: 'Failed', className: 'text-destructive' },
  failed: { icon: AlertCircle, text: 'Failed', className: 'text-destructive' },
}

const DOUBLE_TAP_DELAY = 300

export function MessageBubble({
  content,
  senderName,
  senderImage,
  createdAt,
  isOwn,
  status,
  showAvatar = true,
  isLastOwn = false,
  replyTo,
  reactions = [],
  onReactionClick,
  onReplyClick,
  onDoubleClick,
}: MessageBubbleProps) {
  const lastTapRef = useRef(0)
  const [showHeartAnimation, setShowHeartAnimation] = useState(false)

  const handleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      setShowHeartAnimation(true)
      onDoubleClick?.()
      setTimeout(() => setShowHeartAnimation(false), 800)
    }
    lastTapRef.current = now
  }, [onDoubleClick])

  const renderStatus = () => {
    if (!isOwn || !status) return null

    const config = statusConfig[status]
    if (!config) return null

    const Icon = config.icon

    return (
      <>
        <Icon className={cn('h-3 w-3', config.className)} />
        {isLastOwn && (
          <span className={cn('text-[10px]', config.className)}>{config.text}</span>
        )}
      </>
    )
  }

  return (
    <div className={cn('flex gap-2 max-w-[85%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderImage || ''} alt={senderName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div
          onClick={handleTap}
          className={cn(
            'rounded-2xl px-4 py-2 max-w-full relative cursor-pointer select-none',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {/* Heart animation overlay */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart 
                className="h-12 w-12 text-red-500 fill-red-500 animate-heart-pop" 
              />
            </div>
          )}
          
          {replyTo && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReplyClick?.()
              }}
              className={cn(
                'flex items-start gap-2 mb-2 p-2 rounded-lg text-left w-full',
                isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'
              )}
            >
              <div className={cn(
                'w-0.5 h-full min-h-[32px] rounded-full shrink-0',
                isOwn ? 'bg-primary-foreground/50' : 'bg-primary'
              )} />
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-xs font-medium truncate',
                  isOwn ? 'text-primary-foreground/70' : 'text-primary'
                )}>
                  {replyTo.senderName || 'Unknown'}
                </p>
                <p className={cn(
                  'text-xs truncate',
                  isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}>
                  {replyTo.content}
                </p>
              </div>
            </button>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>

        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReactionClick?.(reaction.emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
                  'transition-all duration-200 active:scale-95',
                  'animate-in zoom-in-50 duration-200',
                  reaction.hasOwn
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted border-transparent hover:border-border'
                )}
              >
                <span className="animate-in zoom-in duration-300">{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(new Date(createdAt))}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  )
}
