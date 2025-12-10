export type User = {
  id: string
  email: string
  name: string | null
  image: string | null
  lastSeen: Date
  isOnline: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserWithStatus = User & {
  isOnline: boolean
  lastSeen: Date
}

export type ChatSession = {
  id: string
  participants: User[]
  createdAt: Date
  updatedAt: Date
}

export type ChatSessionWithDetails = {
  id: string
  participant: {
    id: string
    name: string | null
    image: string | null
    isOnline: boolean
  } | null
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
  } | null
  updatedAt: string | Date
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type Attachment = {
  id: string
  type: string
  url: string
  name: string
  size?: number
  mimeType?: string | null
}

export type Reaction = {
  id: string
  emoji: string
  userId: string
  user?: User
  messageId: string
  createdAt: Date
}

export type MessageSender = {
  id: string
  name: string | null
  image: string | null
}

export type Message = {
  id: string
  content: string
  senderId: string
  sender?: MessageSender | User
  sessionId: string
  read?: boolean
  delivered?: boolean
  replyToId?: string | null
  replyTo?: Message | null
  attachments?: Attachment[]
  reactions?: Reaction[]
  createdAt: Date
}

export type MessageWithStatus = Message & {
  status?: MessageStatus
  tempId?: string
}

export type AIMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export type AIConversation = {
  id: string
  title: string | null
  userId: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
}

// Socket Event Payloads
export type SocketUserPayload = {
  userId: string
}

export type SocketMessagePayload = {
  sessionId: string
  content: string
  tempId: string
  replyToId?: string
  attachments?: Omit<Attachment, 'id'>[]
}

export type SocketTypingPayload = {
  sessionId: string
  userId: string
}

export type SocketReadPayload = {
  sessionId: string
  messageIds: string[]
}

export type SocketNewMessagePayload = Message & {
  tempId?: string
}

export type SocketDeliveredPayload = {
  messageId: string
  deliveredAt: Date
}

export type SocketReadReceiptPayload = {
  messageIds: string[]
  readAt: Date
}

export type SocketUserOnlinePayload = {
  userId: string
}

export type SocketUserOfflinePayload = {
  userId: string
  lastSeen: Date
}

export type SocketTypingUpdatePayload = {
  sessionId: string
  userId: string
  isTyping: boolean
}

export type SocketErrorPayload = {
  message: string
  code?: string
}

// API Response Types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// UI State Types
export type Theme = 'light' | 'dark' | 'system'

export type SidebarTab = 'users' | 'chats' | 'ai'

export type TypingState = {
  [sessionId: string]: string[]
}

export type OnlineUsersMap = {
  [userId: string]: boolean
}

export type LastSeenMap = {
  [userId: string]: Date
}

export type UnreadCountMap = {
  [sessionId: string]: number
}

export type MessagesMap = {
  [sessionId: string]: MessageWithStatus[]
}

// Auth Types
export type AuthUser = {
  id: string
  email: string
  name: string | null
  image: string | null
}

export type RegisterInput = {
  email: string
  password: string
  name: string
}

export type LoginInput = {
  email: string
  password: string
}

// Cloudinary Types
export type CloudinaryUploadResult = {
  public_id: string
  secure_url: string
  resource_type: string
  format: string
  bytes: number
  original_filename: string
}

export type UploadSignatureResponse = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

