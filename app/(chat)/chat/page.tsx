'use client'

import { ChatList } from '@/components/chat/ChatList'

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col pb-14 md:pb-0">
      <header className="shrink-0 bg-background border-b px-4 py-3 md:hidden">
        <h1 className="text-lg font-semibold">Chats</h1>
        <p className="text-sm text-muted-foreground">Your conversations</p>
      </header>
      <div className="flex-1 overflow-auto">
        <ChatList />
      </div>
    </div>
  )
}
