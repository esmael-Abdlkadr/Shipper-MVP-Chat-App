'use client'

interface TypingIndicatorProps {
  userName?: string
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex gap-1 items-center bg-muted rounded-full px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-bounce" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-bounce-delay-1" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-typing-bounce-delay-2" />
      </div>
      <span className="text-xs">{userName ? `${userName} is typing` : 'typing'}</span>
    </div>
  )
}
