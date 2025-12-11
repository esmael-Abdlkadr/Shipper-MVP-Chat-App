import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

type SocketState = {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
}

type SocketActions = {
  connect: (userId: string) => void
  disconnect: () => void
  setConnected: (connected: boolean) => void
}

export const useSocketStore = create<SocketState & SocketActions>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,

  connect: (userId: string) => {
    const { socket, isConnected, isConnecting } = get()

    if (socket && (isConnected || isConnecting)) {
      return
    }

    set({ isConnecting: true })


    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'

    const newSocket = io(socketUrl, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      set({ isConnected: true, isConnecting: false })
    })

    newSocket.on('disconnect', () => {
      set({ isConnected: false })
    })

    newSocket.on('connect_error', () => {
      set({ isConnecting: false })
    })

    set({ socket: newSocket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false, isConnecting: false })
    }
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),
}))
