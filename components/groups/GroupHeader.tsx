'use client'

import { Users, Settings, Crown, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { GroupDetails } from '@/stores/useGroupStore'

interface GroupHeaderProps {
  group: GroupDetails
  onSettingsClick: () => void
}

export function GroupHeader({ group, onSettingsClick }: GroupHeaderProps) {
  const onlineCount = group.members.filter((m) => m.isOnline).length

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={group.avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {group.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{group.name}</h2>
            {group.isCreator && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                <Crown className="h-3 w-3" />
                Creator
              </Badge>
            )}
            {group.aiEnabled && (
              <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                <Bot className="h-3 w-3" />
                AI
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{group.memberCount} members</span>
            <span className="text-green-500">• {onlineCount} online</span>
          </div>
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={onSettingsClick}>
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  )
}

