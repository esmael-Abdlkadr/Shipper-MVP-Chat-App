'use client'

import { useState, useCallback } from 'react'
import { Loader2, Users, Search, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type User = {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateGroup: (data: { name: string; description?: string; memberIds: string[] }) => Promise<void>
}

export function CreateGroupModal({ open, onOpenChange, onCreateGroup }: CreateGroupModalProps) {
  const [step, setStep] = useState<'details' | 'members'>('details')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const users = await res.json()
        setSearchResults(users.filter((u: User) => !selectedUsers.some((s) => s.id === u.id)))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [selectedUsers])

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
    setSearchQuery('')
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      await onCreateGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedUsers.map((u) => u.id),
      })
      handleClose()
    } catch (error) {
      console.error('Create error:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setName('')
    setDescription('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedUsers([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Create New Group' : 'Add Members'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details'
              ? 'Give your group a name and description'
              : 'Search and add members to your group'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Squad Goals 🔥"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this group about?"
                maxLength={200}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                    {user.name || user.email}
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {(user.name || user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || 'No name'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Check className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'details' ? (
            <Button onClick={() => setStep('members')} disabled={!name.trim()}>
              <Users className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Group {selectedUsers.length > 0 && `(${selectedUsers.length + 1} members)`}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

