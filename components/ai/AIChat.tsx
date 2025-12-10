'use client'

import { useRef, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIMessage } from './AIMessage'
import { AIInput } from './AIInput'
import { getGreeting, PERSONALITIES, PersonalityType } from '@/lib/ai/config'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface AIChatProps {
  messages: AIMessage[]
  userName: string | null
  isStreaming: boolean
  streamingContent: string
  onSend: (message: string) => void
  onStop: () => void
  onRegenerate: () => void
  personality?: PersonalityType
}

export function AIChat({
  messages,
  userName,
  isStreaming,
  streamingContent,
  onSend,
  onStop,
  onRegenerate,
  personality = 'hype',
}: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasMessages = messages.length > 0 || isStreaming
  const currentPersonality = PERSONALITIES[personality]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const lastMessage = messages[messages.length - 1]
  const canRegenerate = lastMessage?.role === 'assistant' && !isStreaming

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {!hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">{currentPersonality.emoji}</div>
            <h2 className="text-2xl font-semibold mb-2">
              {getGreeting(userName, personality)}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm">
              {currentPersonality.description} - pick a vibe above or just start chatting!
            </p>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => (
              <AIMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            
            {isStreaming && streamingContent && (
              <AIMessage
                role="assistant"
                content={streamingContent}
                isStreaming
              />
            )}
          </div>
        )}
      </div>

      {canRegenerate && (
        <div className="flex justify-center pb-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRegenerate}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate response
          </Button>
        </div>
      )}

      <AIInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
      />
    </div>
  )
}

