import { create } from 'zustand'
import type {
  ChatSessionWithDetails,
  MessageWithStatus,
  MessagesMap,
  UnreadCountMap,
} from '@/types'

type ChatState = {
  sessions: ChatSessionWithDetails[]
  activeSessionId: string | null
  messages: MessagesMap
  unreadCounts: UnreadCountMap
  isLoadingMessages: boolean
  hasMoreMessages: { [sessionId: string]: boolean }
}

type ChatActions = {
  setSessions: (sessions: ChatSessionWithDetails[]) => void
  addSession: (session: ChatSessionWithDetails) => void
  updateSession: (sessionId: string, updates: Partial<ChatSessionWithDetails>) => void
  setActiveSession: (sessionId: string | null) => void
  setMessages: (sessionId: string, messages: MessageWithStatus[]) => void
  addMessage: (sessionId: string, message: MessageWithStatus) => void
  prependMessages: (sessionId: string, messages: MessageWithStatus[]) => void
  updateMessageStatus: (
    sessionId: string,
    messageId: string,
    status: MessageWithStatus['status']
  ) => void
  updateMessageById: (
    sessionId: string,
    messageId: string,
    updates: Partial<MessageWithStatus>
  ) => void
  replaceMessageByTempId: (
    sessionId: string,
    tempId: string,
    message: MessageWithStatus
  ) => void
  markAsRead: (sessionId: string) => void
  incrementUnread: (sessionId: string) => void
  setUnreadCount: (sessionId: string, count: number) => void
  setLoadingMessages: (loading: boolean) => void
  setHasMore: (sessionId: string, hasMore: boolean) => void
  getMessages: (sessionId: string) => MessageWithStatus[]
  getUnreadCount: (sessionId: string) => number
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  unreadCounts: {},
  isLoadingMessages: false,
  hasMoreMessages: {},

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  setMessages: (sessionId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    })),

  addMessage: (sessionId, message) =>
    set((state) => {
      const currentMessages = state.messages[sessionId] || []
      const exists = currentMessages.some(
        (m) => m.id === message.id || (message.tempId && m.tempId === message.tempId)
      )
      if (exists) return state

      return {
        messages: {
          ...state.messages,
          [sessionId]: [...currentMessages, message],
        },
      }
    }),

  prependMessages: (sessionId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...messages, ...(state.messages[sessionId] || [])],
      },
    })),

  updateMessageStatus: (sessionId, messageId, status) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) =>
          m.id === messageId ? { ...m, status } : m
        ),
      },
    })),

  updateMessageById: (sessionId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  replaceMessageByTempId: (sessionId, tempId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) =>
          m.tempId === tempId ? { ...message, tempId } : m
        ),
      },
    })),

  markAsRead: (sessionId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [sessionId]: 0 },
    })),

  incrementUnread: (sessionId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [sessionId]: (state.unreadCounts[sessionId] || 0) + 1,
      },
    })),

  setUnreadCount: (sessionId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [sessionId]: count },
    })),

  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  setHasMore: (sessionId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [sessionId]: hasMore },
    })),

  getMessages: (sessionId) => get().messages[sessionId] || [],

  getUnreadCount: (sessionId) => get().unreadCounts[sessionId] || 0,
}))

