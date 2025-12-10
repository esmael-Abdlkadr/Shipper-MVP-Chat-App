'use client'

import { Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

export default function AIPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <div className="h-full flex flex-col pb-14 md:pb-0">
      <header className="shrink-0 bg-background border-b px-4 py-3 md:hidden">
        <h1 className="text-lg font-semibold">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">Chat with your AI companion</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">
          Hello, {userName}! 👋
        </h2>
        <p className="text-muted-foreground max-w-md mb-8">
          I&apos;m your AI assistant powered by Google Gemini. 
          Ask me anything - I&apos;m here to help with questions, ideas, or just a friendly chat!
        </p>

        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Start New Conversation
        </Button>
      </div>
    </div>
  )
}
