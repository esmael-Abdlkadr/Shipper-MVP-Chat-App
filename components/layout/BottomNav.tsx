'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Users, Sparkles, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSessions } from '@/lib/queries'

export function BottomNav() {
  const pathname = usePathname()
  const { sessions } = useSessions()

  const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0)

  const navItems = [
    { label: 'Chats', href: '/chat', icon: MessageCircle, badge: totalUnread },
    { label: 'Users', href: '/users', icon: Users, badge: 0 },
    { label: 'AI', href: '/ai', icon: Sparkles, badge: 0 },
    { label: 'Settings', href: '/settings', icon: Settings, badge: 0 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
