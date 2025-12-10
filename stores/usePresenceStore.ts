import { create } from 'zustand'
import type { OnlineUsersMap, LastSeenMap, TypingState } from '@/types'

type PresenceState = {
  onlineUsers: OnlineUsersMap
  lastSeenMap: LastSeenMap
  typingUsers: TypingState
}

type PresenceActions = {
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string, lastSeen: Date) => void
  setOnlineUsers: (users: OnlineUsersMap) => void
  setTyping: (sessionId: string, userId: string, isTyping: boolean) => void
  clearTyping: (sessionId: string) => void
  isUserOnline: (userId: string) => boolean
  getLastSeen: (userId: string) => Date | null
  getTypingUsers: (sessionId: string) => string[]
}

export const usePresenceStore = create<PresenceState & PresenceActions>((set, get) => ({
  onlineUsers: {},
  lastSeenMap: {},
  typingUsers: {},

  setUserOnline: (userId: string) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: true },
    })),

  setUserOffline: (userId: string, lastSeen: Date) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: false },
      lastSeenMap: { ...state.lastSeenMap, [userId]: lastSeen },
    })),

  setOnlineUsers: (users: OnlineUsersMap) =>
    set({ onlineUsers: users }),

  setTyping: (sessionId: string, userId: string, isTyping: boolean) =>
    set((state) => {
      const currentTyping = state.typingUsers[sessionId] || []

      if (isTyping && !currentTyping.includes(userId)) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [sessionId]: [...currentTyping, userId],
          },
        }
      }

      if (!isTyping) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [sessionId]: currentTyping.filter((id) => id !== userId),
          },
        }
      }

      return state
    }),

  clearTyping: (sessionId: string) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [sessionId]: [],
      },
    })),

  isUserOnline: (userId: string) => {
    return get().onlineUsers[userId] ?? false
  },

  getLastSeen: (userId: string) => {
    return get().lastSeenMap[userId] ?? null
  },

  getTypingUsers: (sessionId: string) => {
    return get().typingUsers[sessionId] ?? []
  },
}))

