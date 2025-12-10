'use client'

import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { SocketProvider } from './SocketProvider'
import { QueryProvider } from './QueryProvider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
