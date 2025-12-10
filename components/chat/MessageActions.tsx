'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Reply } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
const LONG_PRESS_DURATION = 300

interface MessageActionsProps {
  messageId: string
  onReply: () => void
  onReact: (emoji: string) => void
  isOwn?: boolean
  children: React.ReactNode
}

export function MessageActions({
  messageId,
  onReply,
  onReact,
  isOwn,
  children,
}: MessageActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    setShowActions(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setShowActions(false)
  }, [])

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true)
    }, LONG_PRESS_DURATION)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showActions])

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleReaction = (emoji: string) => {
    onReact(emoji)
    setShowActions(false)
  }

  const handleReply = () => {
    onReply()
    setShowActions(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {showActions && (
        <div
          className={cn(
            'absolute z-50 flex items-center gap-1 bg-background border rounded-full shadow-lg px-2 py-1.5 -top-12',
            isOwn ? 'right-0' : 'left-0'
          )}
        >
          <button
            onClick={handleReply}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            title="Reply"
          >
            <Reply className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-1 rounded-full hover:bg-muted transition-colors text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

