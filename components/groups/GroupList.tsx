'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, MoreHorizontal, Trash2, Settings, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Group } from '@/stores/useGroupStore'
import { formatDistanceToNow } from 'date-fns'

interface GroupListProps {
  groups: Group[]
  activeGroupId: string | null
  onSelect: (id: string) => void
  onCreateNew: () => void
  onDelete: (id: string) => void
  onSettings: (id: string) => void
}

export function GroupList({
  groups,
  activeGroupId,
  onSelect,
  onCreateNew,
  onDelete,
  onSettings,
}: GroupListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <Button onClick={onCreateNew} className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {groups.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8 px-4">
            No groups yet.
            <br />
            Create one to get started!
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <div
                key={group.id}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer relative',
                  activeGroupId === group.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelect(group.id)}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={group.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {group.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">{group.name}</span>
                    {group.myRole === 'admin' && (
                      <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {group.lastMessage ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {group.lastMessage.isAI ? '🤖 ' : ''}
                      {group.lastMessage.senderName}: {group.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <Users className="h-3 w-3 inline mr-1" />
                      {group.memberCount} members
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {group.lastMessage && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(group.lastMessage.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="h-7 w-7 shrink-0 rounded-md hover:bg-muted active:bg-muted flex items-center justify-center transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        type="button"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onSettings(group.id)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      {group.myRole === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(group.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

