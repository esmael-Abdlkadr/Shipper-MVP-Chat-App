export const queryKeys = {
  users: {
    all: ['users'] as const,
  },

  sessions: {
    all: ['sessions'] as const,
    detail: (id: string) => ['sessions', id] as const,
  },

  messages: {
    bySession: (sessionId: string) => ['messages', sessionId] as const,
    infinite: (sessionId: string) => ['messages', sessionId, 'infinite'] as const,
  },

  ai: {
    conversations: ['ai', 'conversations'] as const,
    conversation: (id: string) => ['ai', 'conversations', id] as const,
  },
}
