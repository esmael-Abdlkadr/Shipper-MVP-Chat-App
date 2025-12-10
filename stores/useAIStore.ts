import { create } from 'zustand'

type AIMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

type AIConversation = {
  id: string
  title: string | null
  createdAt: Date
  updatedAt: Date
}

type AIState = {
  conversations: AIConversation[]
  activeConversationId: string | null
  messages: AIMessage[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
}

type AIActions = {
  setConversations: (conversations: AIConversation[]) => void
  addConversation: (conversation: AIConversation) => void
  updateConversation: (id: string, updates: Partial<AIConversation>) => void
  removeConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (messages: AIMessage[]) => void
  addMessage: (message: AIMessage) => void
  updateLastMessage: (content: string) => void
  removeLastAssistantMessage: () => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  clearStreamingContent: () => void
  reset: () => void
}

const initialState: AIState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
}

export const useAIStore = create<AIState & AIActions>((set) => ({
  ...initialState,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const lastIndex = messages.length - 1
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content }
      }
      return { messages }
    }),

  removeLastAssistantMessage: () =>
    set((state) => {
      const messages = [...state.messages]
      const lastIndex = messages.length - 1
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages.pop()
      }
      return { messages }
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setStreamingContent: (streamingContent) => set({ streamingContent }),

  appendStreamingContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  reset: () => set(initialState),
}))
