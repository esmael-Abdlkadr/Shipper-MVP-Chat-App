'use client'

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { Send, Bot, Loader2, X, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GroupMessage } from '@/stores/useGroupStore'

interface GroupInputProps {
  onSend: (message: string, replyToId?: string) => void
  onEditMessage?: (messageId: string, content: string) => void
  disabled?: boolean
  aiEnabled?: boolean
  placeholder?: string
  replyingTo?: GroupMessage | null
  editingMessage?: GroupMessage | null
  onCancelReply?: () => void
  onCancelEdit?: () => void
}

export function GroupInput({
  onSend,
  onEditMessage,
  disabled,
  aiEnabled = true,
  placeholder = 'Type a message...',
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
}: GroupInputProps) {
  const [message, setMessage] = useState(editingMessage?.content ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isEditing = !!editingMessage
  
  const editingId = editingMessage?.id

  useEffect(() => {
    if (editingMessage) {
      queueMicrotask(() => setMessage(editingMessage.content))
    }
  }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingMessage || replyingTo) {
      textareaRef.current?.focus()
    }
  }, [editingMessage, replyingTo])

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    if (editingMessage && onEditMessage) {
      onEditMessage(editingMessage.id, trimmed)
    } else {
      onSend(trimmed, replyingTo?.id)
    }
    
    setMessage('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [message, disabled, onSend, onEditMessage, replyingTo, editingMessage])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      if (editingMessage) {
        onCancelEdit?.()
        setMessage('')
      } else if (replyingTo) {
        onCancelReply?.()
      }
    }
  }

  const handleCancel = () => {
    if (editingMessage) {
      onCancelEdit?.()
      setMessage('')
    } else if (replyingTo) {
      onCancelReply?.()
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }

  const insertMention = () => {
    const newMessage = message ? `${message} @shipper ` : '@shipper '
    setMessage(newMessage)
    textareaRef.current?.focus()
  }

  const hasShipperMention = /@shipper\b/i.test(message)

  return (
    <div className="border-t bg-background">
      {editingMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
          <div className="w-1 h-10 bg-amber-500 rounded-full shrink-0" />
          <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Editing message</p>
            <p className="text-sm text-amber-600/70 dark:text-amber-400/70 truncate">
              {editingMessage.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {replyingTo && !editingMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
          <div className="w-1 h-10 bg-primary rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              Replying to {replyingTo.isAI ? 'Shipper' : (replyingTo.senderName || 'Unknown')}
            </p>
            <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {aiEnabled && !isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={insertMention}
            className={cn(
              'shrink-0 h-10 w-10 rounded-full transition-colors',
              hasShipperMention && 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
            )}
            title="Mention @shipper"
          >
            <Bot className="h-5 w-5" />
          </Button>
        )}

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={
              isEditing
                ? 'Edit your message...'
                : replyingTo
                ? 'Type your reply...'
                : aiEnabled
                ? 'Type a message... (Use @shipper for AI)'
                : placeholder
            }
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border bg-muted/50 px-4 py-2.5 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'placeholder:text-muted-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px] max-h-[150px]',
              isEditing && 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
            )}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className={cn(
            'shrink-0 h-10 w-10 rounded-full',
            isEditing && 'bg-amber-500 hover:bg-amber-600'
          )}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isEditing ? (
            <Check className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {hasShipperMention && !isEditing && (
        <p className="text-xs text-blue-600 dark:text-blue-400 px-4 pb-2 flex items-center gap-1">
          <Bot className="h-3 w-3" />
          Shipper will respond to this message
        </p>
      )}
    </div>
  )
}
