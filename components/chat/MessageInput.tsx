'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Send, Paperclip, Smile, X } from 'lucide-react'
import { useChatStore } from '@/stores/useChatStore'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  disabled?: boolean
  placeholder?: string
}

interface EmojiData {
  native: string
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { replyingTo, clearReplyingTo } = useChatStore()

  const handleTyping = useCallback(() => {
    onTypingStart?.()

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.()
    }, 2000)
  }, [onTypingStart, onTypingStop])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return

    onSend(trimmed, replyingTo?.id)
    setValue('')
    clearReplyingTo()
    onTypingStop?.()

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    inputRef.current?.focus()
  }, [value, onSend, onTypingStop, replyingTo, clearReplyingTo])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === 'Escape' && replyingTo) {
        clearReplyingTo()
      }
    },
    [handleSend, replyingTo, clearReplyingTo]
  )

  const handleEmojiSelect = useCallback((emoji: EmojiData) => {
    const textarea = inputRef.current
    if (!textarea) {
      setValue((prev) => prev + emoji.native)
      setEmojiOpen(false)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.slice(0, start) + emoji.native + value.slice(end)
    setValue(newValue)
    setEmojiOpen(false)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + emoji.native.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value])

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus()
    }
  }, [replyingTo])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="border-t bg-background">
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
          <div className="w-1 h-10 bg-primary rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              Replying to {replyingTo.senderName || 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={clearReplyingTo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
        <Button variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              handleTyping()
            }}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? 'Type your reply...' : placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-2xl border bg-muted/50 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
            style={{ height: 'auto', overflow: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`
            }}
          />
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1 h-8 w-8"
                disabled={disabled}
                type="button"
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-xl"
              side="top"
              align="end"
              sideOffset={8}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          size="icon"
          className="shrink-0 rounded-full h-11 w-11"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
