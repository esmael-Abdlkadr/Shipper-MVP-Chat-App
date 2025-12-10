'use client'

import { memo, useState, useRef, useCallback, useMemo, TouchEvent, MouseEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bot, Crown, Reply, Copy, Pencil, Trash2, Ban, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ReplyTo } from '@/stores/useGroupStore'
import { toast } from 'sonner'

interface GroupMessageProps {
  id: string
  content: string
  senderName: string | null
  senderImage: string | null
  isAI: boolean
  isOwn: boolean
  isAdmin?: boolean
  isCreator?: boolean
  createdAt: Date
  editedAt?: Date | null
  isDeleted?: boolean
  isStreaming?: boolean
  replyTo?: ReplyTo | null
  onReply?: () => void
  onEdit?: () => void
  onDeleteForMe?: () => void
  onDeleteForAll?: () => void
}

const SWIPE_THRESHOLD = 60
const LONG_PRESS_DURATION = 500

export const GroupMessage = memo(function GroupMessage({
  content,
  senderName,
  senderImage,
  isAI,
  isOwn,
  isAdmin,
  isCreator,
  createdAt,
  editedAt,
  isDeleted,
  isStreaming,
  replyTo,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
}: GroupMessageProps) {
  const displayName = isAI ? 'Shipper' : senderName || 'Unknown'
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const isSwiping = useRef(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef({ x: 0, y: 0 })

  const canModify = useMemo(() => {
    if (isAI || !isOwn) return false
    const timeSinceCreation = new Date().getTime() - new Date(createdAt).getTime()
    return timeSinceCreation < 48 * 60 * 60 * 1000
  }, [isAI, isOwn, createdAt])

  const handleCopy = useCallback(() => {
    if (content) {
      navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    }
    setMenuOpen(false)
  }, [content])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isSwiping.current = false

    longPressTimer.current = setTimeout(() => {
      if (!isSwiping.current) {
        setMenuPosition({ x: touchStartPos.current.x, y: touchStartPos.current.y })
        setMenuOpen(true)
      }
    }, LONG_PRESS_DURATION)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x)
    const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y)
    if (moveX > 10 || moveY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    if (!onReply) return

    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current

    const allowedDiff = isOwn ? Math.min(0, diff) : Math.max(0, diff)
    const absDiff = Math.abs(allowedDiff)

    if (absDiff > 10) {
      isSwiping.current = true
      const cappedDiff = Math.sign(allowedDiff) * Math.min(absDiff, SWIPE_THRESHOLD + 20)
      setSwipeOffset(cappedDiff)
    }
  }, [isOwn, onReply])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (isSwiping.current && Math.abs(swipeOffset) >= SWIPE_THRESHOLD && onReply) {
      onReply()
    }
    setSwipeOffset(0)
    isSwiping.current = false
  }, [swipeOffset, onReply])

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }, [])

  const showReplyIndicator = Math.abs(swipeOffset) >= SWIPE_THRESHOLD

  if (isDeleted) {
    return (
      <div className={cn('flex gap-3 px-4 py-2', isOwn && 'flex-row-reverse')}>
        {!isOwn && (
          <Avatar className="h-8 w-8 shrink-0 mt-1 opacity-50">
            {isAI ? (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={senderImage || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        )}
        <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
          <div className={cn('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
            <span className="text-sm font-medium text-muted-foreground">{displayName}</span>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(createdAt), 'HH:mm')}
            </span>
          </div>
          <div className={cn(
            'rounded-2xl px-4 py-2 text-sm italic text-muted-foreground',
            'bg-muted/50 border border-dashed border-muted-foreground/30',
            isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
          )}>
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              <span>This message was deleted</span>
            </div>
          </div>
        </div>
        {isOwn && (
          <Avatar className="h-8 w-8 shrink-0 mt-1 opacity-50">
            <AvatarImage src={senderImage || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('relative group', isOwn && 'flex justify-end')}
      onContextMenu={handleContextMenu}
    >
      {swipeOffset !== 0 && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity',
            isOwn ? 'right-0' : 'left-0',
            showReplyIndicator ? 'opacity-100' : 'opacity-50'
          )}
          style={{ [isOwn ? 'right' : 'left']: '8px' }}
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            showReplyIndicator ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <Reply className="h-4 w-4" />
          </div>
        </div>
      )}

      <div
        className={cn('flex gap-3 px-4 py-2 transition-transform')}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isOwn && (
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 mr-1">
            {onReply && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onReply}>
                <Reply className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {onReply && (
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDeleteForMe && (
                  <DropdownMenuItem onClick={onDeleteForMe} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for me
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!isOwn && (
          <Avatar className="h-8 w-8 shrink-0 mt-1">
            {isAI ? (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={senderImage || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        )}

        <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
          <div className={cn('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
            <span className={cn('text-sm font-medium', isAI && 'text-blue-600 dark:text-blue-400')}>
              {displayName}
            </span>
            {isCreator && (
              <Badge variant="outline" className="h-4 px-1 text-[10px] gap-0.5 text-amber-600 border-amber-300">
                <Crown className="h-2 w-2" />
              </Badge>
            )}
            {isAdmin && !isCreator && (
              <Badge variant="outline" className="h-4 px-1 text-[10px] text-muted-foreground">
                Admin
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(createdAt), 'HH:mm')}
            </span>
            {editedAt && (
              <span className="text-[10px] text-muted-foreground italic">edited</span>
            )}
          </div>

          <div
            className={cn(
              'rounded-2xl px-4 py-2 text-sm',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : isAI
                ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-tl-sm'
                : 'bg-muted rounded-tl-sm'
            )}
          >
            {replyTo && (
              <div className={cn(
                'flex items-start gap-2 mb-2 p-2 rounded-lg text-left w-full -mx-1',
                isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'
              )}>
                <div className={cn(
                  'w-0.5 h-full min-h-[28px] rounded-full shrink-0',
                  isOwn ? 'bg-primary-foreground/50' : 'bg-primary'
                )} />
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    isOwn ? 'text-primary-foreground/70' : 'text-primary'
                  )}>
                    {replyTo.isAI ? 'Shipper' : (replyTo.senderName || 'Unknown')}
                  </p>
                  <p className={cn(
                    'text-xs truncate',
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {replyTo.isDeleted ? 'This message was deleted' : replyTo.content}
                  </p>
                </div>
              </div>
            )}
            <p className="whitespace-pre-wrap break-words">{content}</p>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>
        </div>

        {isOwn && (
          <Avatar className="h-8 w-8 shrink-0 mt-1">
            <AvatarImage src={senderImage || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {isOwn && (
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {onReply && (
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {canModify && onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDeleteForMe && (
                  <DropdownMenuItem onClick={onDeleteForMe}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for me
                  </DropdownMenuItem>
                )}
                {canModify && onDeleteForAll && (
                  <DropdownMenuItem onClick={onDeleteForAll} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for everyone
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {onReply && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onReply}>
                <Reply className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-48"
          style={{ position: 'fixed', left: menuPosition.x, top: menuPosition.y }}
        >
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </DropdownMenuItem>
          {onReply && (
            <DropdownMenuItem onClick={() => { onReply(); setMenuOpen(false); }}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>
          )}
          {isOwn && canModify && onEdit && (
            <DropdownMenuItem onClick={() => { onEdit(); setMenuOpen(false); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onDeleteForMe && (
            <DropdownMenuItem onClick={() => { onDeleteForMe(); setMenuOpen(false); }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete for me
            </DropdownMenuItem>
          )}
          {isOwn && canModify && onDeleteForAll && (
            <DropdownMenuItem onClick={() => { onDeleteForAll(); setMenuOpen(false); }} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete for everyone
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
