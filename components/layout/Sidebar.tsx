'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Users, Sparkles, Settings, Plus, Search, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChatList } from '@/components/chat/ChatList'
import { UserList } from '@/components/chat/UserList'
import { useSessions, useCreateSession } from '@/lib/queries'

export function Sidebar() {
  const pathname = usePathname()
  const { createSession } = useCreateSession()
  const { sessions } = useSessions()

  const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0)

  const showChatList = pathname === '/chat' || pathname.startsWith('/chat/')
  const showUserList = pathname === '/users'

  const navItems = [
    { label: 'Chats', href: '/chat', icon: MessageCircle, badge: totalUnread },
    { label: 'Groups', href: '/groups', icon: UsersRound, badge: 0 },
    { label: 'AI Assistant', href: '/ai', icon: Sparkles, badge: 0 },
    { label: 'Settings', href: '/settings', icon: Settings, badge: 0 },
  ]

  return (
    <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r bg-muted/30 h-[calc(100vh-3.5rem)]">
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 bg-background" />
        </div>
        <Button className="w-full" size="sm" asChild>
          <Link href="/users">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Link>
        </Button>
      </div>

      <Separator />

      <nav className="p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                  isActive 
                    ? 'bg-primary-foreground text-primary' 
                    : 'bg-primary text-primary-foreground'
                )}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <ScrollArea className="flex-1">
        {showChatList && <ChatList />}
        {showUserList && <UserList onStartChat={createSession} />}
      </ScrollArea>
    </aside>
  )
}
