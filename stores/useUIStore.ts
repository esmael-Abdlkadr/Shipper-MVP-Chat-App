import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, SidebarTab, Message } from '@/types'

type UIState = {
  theme: Theme
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  searchQuery: string
  replyingTo: Message | null
  soundEnabled: boolean
  notificationsEnabled: boolean
  isMobileView: boolean
}

type UIActions = {
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: SidebarTab) => void
  setSearchQuery: (query: string) => void
  setReplyingTo: (message: Message | null) => void
  clearReply: () => void
  setSoundEnabled: (enabled: boolean) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setMobileView: (isMobile: boolean) => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      sidebarTab: 'chats',
      searchQuery: '',
      replyingTo: null,
      soundEnabled: true,
      notificationsEnabled: true,
      isMobileView: false,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setReplyingTo: (message) => set({ replyingTo: message }),

      clearReply: () => set({ replyingTo: null }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setMobileView: (isMobile) => set({ isMobileView: isMobile }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
)

