import { create } from 'zustand'

export type GroupMember = {
  id: string
  name: string | null
  image: string | null
  isOnline: boolean
  role: 'admin' | 'member'
  isCreator?: boolean
  joinedAt: Date
}

export type ReplyTo = {
  id: string
  content: string
  senderName: string | null
  isAI: boolean
  isDeleted?: boolean
}

export type GroupMessage = {
  id: string
  content: string
  senderId: string | null
  senderName: string | null
  senderImage: string | null
  isAI: boolean
  createdAt: Date
  editedAt?: Date | null
  isDeleted?: boolean
  replyTo?: ReplyTo | null
}

export type Group = {
  id: string
  name: string
  description: string | null
  avatar: string | null
  memberCount: number
  myRole: 'admin' | 'member'
  lastMessage: {
    content: string
    senderName: string
    createdAt: Date
    isAI: boolean
  } | null
  createdAt: Date
  updatedAt: Date
}

export type GroupDetails = Group & {
  aiEnabled: boolean
  maxMembers: number
  members: GroupMember[]
  isCreator: boolean
}

type GroupState = {
  groups: Group[]
  activeGroupId: string | null
  activeGroup: GroupDetails | null
  messages: Record<string, GroupMessage[]>
  isLoading: boolean
  isLoadingMessages: boolean
  streamingContent: string
  aiTyping: boolean
  replyingTo: GroupMessage | null
  editingMessage: GroupMessage | null
}

type GroupActions = {
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  removeGroup: (id: string) => void
  setActiveGroupId: (id: string | null) => void
  setActiveGroup: (group: GroupDetails | null) => void
  setMessages: (groupId: string, messages: GroupMessage[]) => void
  addMessage: (groupId: string, message: GroupMessage) => void
  replaceMessageByTempId: (groupId: string, tempId: string, message: GroupMessage) => void
  editMessage: (groupId: string, messageId: string, content: string) => void
  deleteMessage: (groupId: string, messageId: string) => void
  hideMessage: (groupId: string, messageId: string) => void
  setLoading: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  clearStreamingContent: () => void
  setAiTyping: (typing: boolean) => void
  addMember: (member: GroupMember) => void
  removeMember: (userId: string) => void
  updateMemberRole: (userId: string, role: 'admin' | 'member') => void
  setReplyingTo: (message: GroupMessage | null) => void
  clearReplyingTo: () => void
  setEditingMessage: (message: GroupMessage | null) => void
  clearEditingMessage: () => void
  reset: () => void
}

const initialState: GroupState = {
  groups: [],
  activeGroupId: null,
  activeGroup: null,
  messages: {},
  isLoading: false,
  isLoadingMessages: false,
  streamingContent: '',
  aiTyping: false,
  replyingTo: null,
  editingMessage: null,
}

export const useGroupStore = create<GroupState & GroupActions>((set, get) => ({
  ...initialState,

  setGroups: (groups) => set({ groups }),

  addGroup: (group) =>
    set((state) => ({
      groups: [group, ...state.groups],
    })),

  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      activeGroup:
        state.activeGroup?.id === id
          ? { ...state.activeGroup, ...updates }
          : state.activeGroup,
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
      activeGroup: state.activeGroup?.id === id ? null : state.activeGroup,
    })),

  setActiveGroupId: (id) => set({ activeGroupId: id }),

  setActiveGroup: (group) => set({ activeGroup: group, activeGroupId: group?.id || null }),

  setMessages: (groupId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [groupId]: messages },
    })),

  addMessage: (groupId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [...(state.messages[groupId] || []), message],
      },
    })),

  replaceMessageByTempId: (groupId, tempId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: (state.messages[groupId] || []).map((m) =>
          m.id === tempId ? message : m
        ),
      },
    })),

  editMessage: (groupId, messageId, content) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: (state.messages[groupId] || []).map((m) =>
          m.id === messageId
            ? { ...m, content, editedAt: new Date() }
            : m
        ),
      },
      editingMessage: null,
    })),

  deleteMessage: (groupId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: (state.messages[groupId] || []).map((m) =>
          m.id === messageId
            ? { ...m, content: '', isDeleted: true }
            : m
        ),
      },
    })),

  hideMessage: (groupId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: (state.messages[groupId] || []).filter((m) => m.id !== messageId),
      },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  setStreamingContent: (streamingContent) => set({ streamingContent }),

  appendStreamingContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setAiTyping: (aiTyping) => set({ aiTyping }),

  addMember: (member) =>
    set((state) => {
      if (!state.activeGroup) return state
      return {
        activeGroup: {
          ...state.activeGroup,
          members: [...state.activeGroup.members, member],
          memberCount: state.activeGroup.memberCount + 1,
        },
      }
    }),

  removeMember: (userId) =>
    set((state) => {
      if (!state.activeGroup) return state
      return {
        activeGroup: {
          ...state.activeGroup,
          members: state.activeGroup.members.filter((m) => m.id !== userId),
          memberCount: state.activeGroup.memberCount - 1,
        },
      }
    }),

  updateMemberRole: (userId, role) =>
    set((state) => {
      if (!state.activeGroup) return state
      return {
        activeGroup: {
          ...state.activeGroup,
          members: state.activeGroup.members.map((m) =>
            m.id === userId ? { ...m, role } : m
          ),
        },
      }
    }),

  setReplyingTo: (message) => set({ replyingTo: message }),

  clearReplyingTo: () => set({ replyingTo: null }),

  setEditingMessage: (message) => set({ editingMessage: message }),

  clearEditingMessage: () => set({ editingMessage: null }),

  reset: () => set(initialState),
}))

