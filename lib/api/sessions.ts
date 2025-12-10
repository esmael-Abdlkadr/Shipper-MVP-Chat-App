import { fetcher } from './index'

export interface SessionParticipant {
  id: string
  name: string | null
  image: string | null
  isOnline: boolean
}

export interface SessionLastMessage {
  content: string
  createdAt: string
  senderId: string
}

export interface ChatSession {
  id: string
  participant: SessionParticipant | null
  lastMessage: SessionLastMessage | null
  updatedAt: string
}

export interface CreateSessionResponse {
  id: string
  existing: boolean
}

export const sessionsApi = {
  getAll: () => fetcher<ChatSession[]>('/api/chat/sessions'),

  create: (participantId: string) =>
    fetcher<CreateSessionResponse>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),
}

