'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OnlineIndicator } from './OnlineIndicator'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'

interface ChatListItemProps {
  id: string
  name: string
  image: string | null
  lastMessage?: string
  lastMessageAt?: Date | string
  unreadCount: number
  isOnline: boolean
  isActive?: boolean
}

export function ChatListItem({
  id,
  name,
  image,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isOnline,
  isActive,
}: ChatListItemProps) {
  return (
    <Link
      href={`/chat/${id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={image || ''} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <OnlineIndicator isOnline={isOnline} size="lg" className="absolute bottom-0 right-0" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">{name}</h3>
          {lastMessageAt && (
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatRelativeTime(new Date(lastMessageAt))}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage || 'Start a conversation'}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground animate-in zoom-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
