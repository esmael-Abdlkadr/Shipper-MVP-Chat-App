import { fetcher } from './index'

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  isOnline: boolean
  lastSeen: Date
}

export const usersApi = {
  getAll: () => fetcher<User[]>('/api/users'),
}

