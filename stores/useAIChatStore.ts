import { create } from 'zustand'
import type { AIConversation, AIMessage } from '@/types'

type AIChatState = {
  conversations: AIConversation[]
  activeConversationId: string | null
  currentMessages: AIMessage[]
  isStreaming: boolean
  isLoadingConversations: boolean
}

type AIChatActions = {
  setConversations: (conversations: AIConversation[]) => void
  addConversation: (conversation: AIConversation) => void
  updateConversation: (id: string, updates: Partial<AIConversation>) => void
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  setCurrentMessages: (messages: AIMessage[]) => void
  addMessage: (message: AIMessage) => void
  appendToLastMessage: (chunk: string) => void
  setStreaming: (streaming: boolean) => void
  setLoadingConversations: (loading: boolean) => void
  getActiveConversation: () => AIConversation | null
  clearCurrentMessages: () => void
}

const generateGreeting = (userName: string | null): AIMessage => {
  const name = userName || 'there'
  const greetings = [
    `Hello ${name}! 👋\n\nHow are you doing today? I'm your AI assistant, ready to help with anything you need.\n\nHave an idea on your mind? Want to:\n• Brainstorm something creative\n• Get help with a task\n• Just have a chat\n\nI'm all ears! ✨`,
    `Hey ${name}! Great to see you! 🌟\n\nWhat's on your mind today? I'm here to help with:\n• Questions and answers\n• Creative ideas\n• Problem solving\n• Or just a friendly conversation\n\nFeel free to ask me anything!`,
    `Hi ${name}! 👋\n\nReady to dive into something interesting today?\n\nWhether you want to:\n• Explore new ideas\n• Get assistance with a project\n• Learn something new\n\nI'm here and excited to help! What shall we work on?`,
  ]
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

  return {
    id: 'greeting',
    role: 'assistant',
    content: randomGreeting,
    createdAt: new Date(),
  }
}

export const useAIChatStore = create<AIChatState & AIChatActions>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  currentMessages: [],
  isStreaming: false,
  isLoadingConversations: false,

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

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  setActiveConversation: (id) => {
    const conversation = get().conversations.find((c) => c.id === id)
    if (conversation) {
      set({
        activeConversationId: id,
        currentMessages: conversation.messages,
      })
    } else {
      set({
        activeConversationId: id,
        currentMessages: [],
      })
    }
  },

  setCurrentMessages: (messages) => set({ currentMessages: messages }),

  addMessage: (message) =>
    set((state) => ({
      currentMessages: [...state.currentMessages.filter(m => m.id !== 'greeting'), message],
    })),

  appendToLastMessage: (chunk) =>
    set((state) => {
      const messages = [...state.currentMessages]
      const lastMessage = messages[messages.length - 1]

      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + chunk,
        }
      }

      return { currentMessages: messages }
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId) || null
  },

  clearCurrentMessages: () => set({ currentMessages: [] }),
}))

export { generateGreeting }

