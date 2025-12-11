'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  AIChat, 
  ConversationList, 
  PersonalityPicker, 
  QuickActions,
} from '@/components/ai'
import { useAIStore } from '@/stores/useAIStore'
import { cn } from '@/lib/utils'
import { PersonalityType, ModelId } from '@/lib/ai/config'
import { QuickActionType, QUICK_ACTIONS } from '@/lib/ai/games'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  model?: string
}

export default function AIPage() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [personality, setPersonality] = useState<PersonalityType>('hype')
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const {
    conversations,
    setConversations,
    updateConversation,
    removeConversation,
    activeConversationId,
    setActiveConversation,
    messages,
    setMessages,
    addMessage,
    isStreaming,
    setStreaming,
    streamingContent,
    setStreamingContent,
    clearStreamingContent,
    selectedModel,
    setSelectedModel,
  } = useAIStore()

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch {}
  }, [setConversations])

  const fetchUserSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/user/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.preferredAIModel) {
          setSelectedModel(data.preferredAIModel as ModelId)
        }
      }
    } catch {}
  }, [setSelectedModel])

  const handleModelChange = useCallback(async (model: ModelId) => {
    setSelectedModel(model)
    // Save preference to backend
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredAIModel: model }),
      })
    } catch {}
  }, [setSelectedModel])

  useEffect(() => {
    setActiveConversation(null)
    setMessages([])
    clearStreamingContent()
    fetchConversations()
    fetchUserSettings()
  }, [setActiveConversation, setMessages, clearStreamingContent, fetchConversations, fetchUserSettings])

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch {}
  }

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id)
    await fetchMessages(id)
    setSidebarOpen(false)
  }

  const handleNewConversation = () => {
    setActiveConversation(null)
    setMessages([])
    clearStreamingContent()
    setSidebarOpen(false)
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        removeConversation(id)
      }
    } catch {}
  }

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        updateConversation(id, { title })
      }
    } catch {}
  }

  const handleSendMessage = useCallback(async (content: string, quickAction?: QuickActionType) => {
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    }
    addMessage(userMessage)
    setStreaming(true)
    clearStreamingContent()

    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: activeConversationId,
          personality,
          quickAction,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) throw new Error('Failed to send message')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader')

      let fullContent = ''
      let newConversationId = activeConversationId

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.conversationId && !newConversationId) {
                newConversationId = data.conversationId
                setActiveConversation(data.conversationId)
              }

              if (data.text) {
                fullContent += data.text
                setStreamingContent(fullContent)
              }

              if (data.done) {
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date(),
                }
                addMessage(assistantMessage)
                clearStreamingContent()
                fetchConversations()
              }

              if (data.error) {
                throw new Error(data.error)
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          createdAt: new Date(),
        }
        addMessage(errorMessage)
      }
    } finally {
      setStreaming(false)
      abortControllerRef.current = null
    }
  }, [activeConversationId, personality, selectedModel, addMessage, setStreaming, clearStreamingContent, setStreamingContent, setActiveConversation, fetchConversations])

  const handleQuickAction = useCallback((action: QuickActionType) => {
    const quickAction = QUICK_ACTIONS[action]
    handleSendMessage(quickAction.message, action)
  }, [handleSendMessage])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setStreaming(false)
      
      if (streamingContent) {
        const partialMessage: Message = {
          id: `partial-${Date.now()}`,
          role: 'assistant',
          content: streamingContent + '\n\n*[Generation stopped]*',
          createdAt: new Date(),
        }
        addMessage(partialMessage)
        clearStreamingContent()
      }
    }
  }, [streamingContent, addMessage, setStreaming, clearStreamingContent])

  const handleRegenerate = useCallback(async () => {
    if (!activeConversationId) return

    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant')
    if (lastAssistantIndex === -1) return

    const newMessages = messages.slice(0, messages.length - 1 - lastAssistantIndex + 1)
    setMessages(newMessages.slice(0, -1))

    setStreaming(true)
    clearStreamingContent()

    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId: activeConversationId,
          personality,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) throw new Error('Failed to regenerate')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.text) {
                fullContent += data.text
                setStreamingContent(fullContent)
              }

              if (data.done) {
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date(),
                }
                addMessage(assistantMessage)
                clearStreamingContent()
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, failed to regenerate. Please try again.',
          createdAt: new Date(),
        }
        addMessage(errorMessage)
      }
    } finally {
      setStreaming(false)
      abortControllerRef.current = null
    }
  }, [activeConversationId, messages, personality, selectedModel, setMessages, addMessage, setStreaming, clearStreamingContent, setStreamingContent])

  return (
    <div className="flex h-full pb-14 md:pb-0 md:gap-4">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conversation sidebar */}
      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-200 md:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'top-14 md:top-0 h-[calc(100%-3.5rem)] md:h-full'
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
        />
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar with menu + personality picker */}
        <div className="shrink-0 border-b bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <PersonalityPicker
              selected={personality}
              onChange={setPersonality}
            />
          </div>
        </div>

        {/* Chat area */}
        <AIChat
          messages={messages}
          userName={session?.user?.name || null}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onSend={(msg) => handleSendMessage(msg)}
          onStop={handleStop}
          onRegenerate={handleRegenerate}
          personality={personality}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />

        {/* Quick actions */}
        <div className="shrink-0 border-t bg-background px-4 py-2">
          <QuickActions
            onAction={handleQuickAction}
            disabled={isStreaming}
          />
        </div>
      </main>
    </div>
  )
}
