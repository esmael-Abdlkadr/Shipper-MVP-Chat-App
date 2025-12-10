'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
}

export function AIInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = 'Message AI Assistant...',
}: AIInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return

    onSend(trimmed)
    setValue('')
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border p-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none min-h-[44px] max-h-[200px]"
          />
          
          {isStreaming ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="ghost"
              className="shrink-0 h-10 w-10 rounded-xl hover:bg-destructive/10"
            >
              <StopCircle className="h-5 w-5 text-destructive" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}

