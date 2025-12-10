import { create } from 'zustand'
import type {
  ChatSessionWithDetails,
  MessageWithStatus,
  MessagesMap,
  UnreadCountMap,
} from '@/types'

type ReplyingTo = {
  id: string
  content: string
  senderName: string | null
} | null

type ChatState = {
  sessions: ChatSessionWithDetails[]
  activeSessionId: string | null
  messages: MessagesMap
  unreadCounts: UnreadCountMap
  isLoadingMessages: boolean
  hasMoreMessages: { [sessionId: string]: boolean }
  replyingTo: ReplyingTo
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
  updateMultipleMessagesStatus: (
    sessionId: string,
    messageIds: string[],
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
  setReplyingTo: (message: ReplyingTo) => void
  clearReplyingTo: () => void
  addReaction: (sessionId: string, messageId: string, emoji: string, userId: string) => void
  removeReaction: (sessionId: string, messageId: string, emoji: string, userId: string) => void
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  unreadCounts: {},
  isLoadingMessages: false,
  hasMoreMessages: {},
  replyingTo: null,

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    })),

  updateSession: (sessionId, updates) =>
    set((state) => {
      const sessionIndex = state.sessions.findIndex((s) => s.id === sessionId)
      
      if (sessionIndex === -1) {
        // Session not in list - create a minimal entry and add to top
        const newSession = {
          id: sessionId,
          participant: null,
          lastMessage: updates.lastMessage || null,
          updatedAt: updates.updatedAt || new Date(),
          ...updates,
        }
        return {
          sessions: [newSession as ChatSessionWithDetails, ...state.sessions],
        }
      }

      const updatedSession = { ...state.sessions[sessionIndex], ...updates }
      const otherSessions = state.sessions.filter((s) => s.id !== sessionId)
      
      return {
        sessions: [updatedSession, ...otherSessions],
      }
    }),

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

  updateMultipleMessagesStatus: (sessionId, messageIds, status) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) =>
          messageIds.includes(m.id) ? { ...m, status } : m
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

  setReplyingTo: (message) => set({ replyingTo: message }),

  clearReplyingTo: () => set({ replyingTo: null }),

  addReaction: (sessionId, messageId, emoji, userId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) => {
          if (m.id !== messageId) return m
          const reactions = m.reactions || []
          const existing = reactions.find((r) => r.emoji === emoji && r.userId === userId)
          if (existing) return m
          return {
            ...m,
            reactions: [
              ...reactions,
              { id: `temp-${Date.now()}`, emoji, userId, messageId, createdAt: new Date() },
            ],
          }
        }),
      },
    })),

  removeReaction: (sessionId, messageId, emoji, userId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) => {
          if (m.id !== messageId) return m
          return {
            ...m,
            reactions: (m.reactions || []).filter(
              (r) => !(r.emoji === emoji && r.userId === userId)
            ),
          }
        }),
      },
    })),
}))

