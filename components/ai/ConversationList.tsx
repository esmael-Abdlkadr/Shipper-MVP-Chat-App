'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string | null
  createdAt: Date
  updatedAt: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => Promise<void>
  onRename: (id: string, title: string) => Promise<void>
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id)
    setEditTitle(conv.title || 'Untitled')
  }

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await onRename(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  const groupByDate = (convs: Conversation[]) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups: { label: string; conversations: Conversation[] }[] = [
      { label: 'Today', conversations: [] },
      { label: 'Yesterday', conversations: [] },
      { label: 'Previous 7 Days', conversations: [] },
      { label: 'Older', conversations: [] },
    ]

    convs.forEach((conv) => {
      const date = new Date(conv.updatedAt)
      if (date.toDateString() === today.toDateString()) {
        groups[0].conversations.push(conv)
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups[1].conversations.push(conv)
      } else if (date > lastWeek) {
        groups[2].conversations.push(conv)
      } else {
        groups[3].conversations.push(conv)
      }
    })

    return groups.filter((g) => g.conversations.length > 0)
  }

  const groups = groupByDate(conversations)

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <Link href="/chat">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Chats
          </Button>
        </Link>
        <Button onClick={onNew} className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          New AI Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer relative',
                    activeId === conv.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => !editingId && onSelect(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                  
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveEdit()
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelEdit()
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0 flex-1">
                        {conv.title || 'Untitled'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-7 w-7 shrink-0 flex-none rounded-md hover:bg-muted active:bg-muted flex items-center justify-center transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            aria-label="More options"
                            type="button"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48" 
                          side="right"
                          sideOffset={8}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(conv)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(conv.id)
                            }}
                            disabled={deletingId === conv.id}
                          >
                            {deletingId === conv.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8 px-4">
            No conversations yet.
            <br />
            Start a new chat!
          </div>
        )}
      </div>
    </div>
  )
}

