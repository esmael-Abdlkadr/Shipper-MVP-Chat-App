'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAIPage = pathname === '/ai' || pathname.startsWith('/ai/')
  const isGroupPage = pathname.startsWith('/groups/')
  const hideSidebar = isAIPage || isGroupPage

  return (
    <div className="h-dvh flex flex-col bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar />}
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
