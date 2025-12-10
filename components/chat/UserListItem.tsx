'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { OnlineIndicator } from './OnlineIndicator'
import { Loader2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface UserListItemProps {
  id: string
  name: string
  email: string
  image: string | null
  isOnline: boolean
  onStartChat?: (userId: string) => Promise<string | null> | void
}

export function UserListItem({ id, name, image, isOnline, onStartChat }: UserListItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStartChat = async () => {
    if (!onStartChat || isLoading) return

    setIsLoading(true)
    try {
      await onStartChat(id)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11">
            <AvatarImage src={image || ''} alt={name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <OnlineIndicator isOnline={isOnline} className="absolute bottom-0 right-0" />
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={handleStartChat} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Chat'}
      </Button>
    </div>
  )
}
