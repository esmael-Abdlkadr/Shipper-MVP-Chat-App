import { fetcher } from './index'
import type { MessageWithStatus } from '@/types'

export interface MessageSender {
  id: string
  name: string | null
  image: string | null
}

export interface SessionDetails {
  id: string
  participant: {
    id: string
    name: string | null
    image: string | null
    isOnline: boolean
    lastSeen: string
  }
}

export interface MessagesResponse {
  session: SessionDetails
  messages: MessageWithStatus[]
  nextCursor: string | null
  hasMore: boolean
}

export interface SendMessageParams {
  sessionId: string
  content: string
  attachments?: { url: string; type: string; name: string; size: number }[]
}

export const messagesApi = {
  getBySession: (sessionId: string, cursor?: string) => {
    const url = cursor
      ? `/api/chat/sessions/${sessionId}?cursor=${cursor}`
      : `/api/chat/sessions/${sessionId}`
    return fetcher<MessagesResponse>(url)
  },

  send: (params: SendMessageParams) =>
    fetcher<MessageWithStatus>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
}

