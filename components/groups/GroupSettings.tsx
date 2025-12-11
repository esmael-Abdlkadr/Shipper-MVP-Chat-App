'use client'

import { useState } from 'react'
import {
  Crown,
  UserPlus,
  Trash2,
  LogOut,
  Shield,
  ShieldOff,
  Bot,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GroupDetails, GroupMember } from '@/stores/useGroupStore'
import { cn } from '@/lib/utils'

interface GroupSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupDetails
  currentUserId: string
  onUpdateGroup: (updates: { name?: string; description?: string; aiEnabled?: boolean }) => Promise<void>
  onAddMembers: () => void
  onRemoveMember: (userId: string) => Promise<void>
  onUpdateRole: (userId: string, role: 'admin' | 'member') => Promise<void>
  onLeaveGroup: () => Promise<void>
  onDeleteGroup: () => Promise<void>
}

export function GroupSettings({
  open,
  onOpenChange,
  group,
  currentUserId,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onUpdateRole,
  onLeaveGroup,
  onDeleteGroup,
}: GroupSettingsProps) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const isAdmin = group.myRole === 'admin'
  const isCreator = group.isCreator

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdateGroup({
        name: name !== group.name ? name : undefined,
        description: description !== group.description ? description : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAI = async () => {
    await onUpdateGroup({ aiEnabled: !group.aiEnabled })
  }

  const handleToggleRole = async (member: GroupMember) => {
    setActionUserId(member.id)
    try {
      await onUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')
    } finally {
      setActionUserId(null)
    }
  }

  const handleRemove = async (userId: string) => {
    setActionUserId(userId)
    try {
      await onRemoveMember(userId)
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>Manage your group settings and members</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Group Details */}
            {isAdmin && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupDesc">Description</Label>
                  <Input
                    id="groupDesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this group about?"
                    maxLength={200}
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (name === group.name && description === (group.description || ''))}
                  size="sm"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </div>
            )}

            <Separator />

            {/* AI Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Shipper AI</p>
                  <p className="text-sm text-muted-foreground">
                    Allow @shipper mentions in this group
                  </p>
                </div>
              </div>
              <Switch
                checked={group.aiEnabled}
                onCheckedChange={handleToggleAI}
                disabled={!isAdmin}
              />
            </div>

            <Separator />

            {/* Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Members ({group.memberCount})</span>
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={onAddMembers}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback>
                        {(member.name || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {member.name || 'Unknown'}
                        </span>
                        {member.isCreator && (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 h-5 text-[10px]">
                            <Crown className="h-2.5 w-2.5" />
                            Creator
                          </Badge>
                        )}
                        {member.role === 'admin' && !member.isCreator && (
                          <Badge variant="outline" className="h-5 text-[10px]">
                            Admin
                          </Badge>
                        )}
                        {member.id === currentUserId && (
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            You
                          </Badge>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs',
                          member.isOnline ? 'text-green-500' : 'text-muted-foreground'
                        )}
                      >
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Actions */}
                    {isAdmin && member.id !== currentUserId && !member.isCreator && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleRole(member)}
                          disabled={actionUserId === member.id}
                          title={member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        >
                          {actionUserId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : member.role === 'admin' ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        {(isCreator || member.role !== 'admin') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(member.id)}
                            disabled={actionUserId === member.id}
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">Danger Zone</p>
              <div className="flex gap-2">
                {!isCreator && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Group
                  </Button>
                )}
                {isCreator && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group.name}"? You'll need to be re-invited to join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onLeaveGroup}
            >
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{group.name}" and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDeleteGroup}
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

