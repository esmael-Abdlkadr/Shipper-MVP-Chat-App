'use client'

import { UserList } from '@/components/chat/UserList'
import { useChatSessions } from '@/hooks/useChatSessions'

export default function UsersPage() {
  const { createSession } = useChatSessions()

  return (
    <div className="h-full flex flex-col pb-14 md:pb-0">
      <header className="shrink-0 bg-background border-b px-4 py-3 md:hidden">
        <h1 className="text-lg font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Find people to chat with</p>
      </header>
      <div className="flex-1 overflow-auto">
        <UserList onStartChat={createSession} />
      </div>
    </div>
  )
}
