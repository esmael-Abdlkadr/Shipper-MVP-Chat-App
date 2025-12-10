'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores'

function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      })
    } else {
      setUser(null)
    }
  }, [session, status, setUser, setLoading])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  )
}

