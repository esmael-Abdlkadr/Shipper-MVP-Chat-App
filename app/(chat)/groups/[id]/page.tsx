'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  GroupList,
  GroupChat,
  GroupHeader,
  CreateGroupModal,
  MemberSearchModal,
  GroupSettings,
} from '@/components/groups'
import { useGroupStore, Group, GroupDetails, GroupMessage } from '@/stores/useGroupStore'
import { useSocketStore } from '@/stores/useSocketStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const groupId = params.id as string

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(searchParams.get('settings') === 'true')
  const abortControllerRef = useRef<AbortController | null>(null)

  const { socket } = useSocketStore()
  const {
    groups,
    setGroups,
    addGroup,
    removeGroup,
    activeGroup,
    setActiveGroup,
    messages,
    setMessages,
    addMessage,
    editMessage,
    deleteMessage,
    hideMessage,
    isLoading,
    setLoading,
    isLoadingMessages,
    setLoadingMessages,
    aiTyping,
    setAiTyping,
    streamingContent,
    setStreamingContent,
    clearStreamingContent,
    addMember,
    removeMember,
    updateMemberRole,
    replyingTo,
    setReplyingTo,
    clearReplyingTo,
    editingMessage,
    setEditingMessage,
    clearEditingMessage,
  } = useGroupStore()

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }, [setGroups])

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setActiveGroup(data)
      } else {
        router.push('/groups')
      }
    } catch (error) {
      console.error('Failed to fetch group:', error)
      router.push('/groups')
    } finally {
      setLoading(false)
    }
  }, [groupId, setActiveGroup, setLoading, router])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(groupId, data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }, [groupId, setMessages, setLoadingMessages])

  useEffect(() => {
    fetchGroups()
    fetchGroupDetails()
    fetchMessages()
    // Clear reply/edit state when changing groups
    clearReplyingTo()
    clearEditingMessage()
  }, [fetchGroups, fetchGroupDetails, fetchMessages, clearReplyingTo, clearEditingMessage])

  // Join/leave group room on socket + listen for edit/delete events
  useEffect(() => {
    if (!socket || !groupId) return

    socket.emit('group:join', { groupId })

    // Listen for message edits from other users
    const handleMessageEdited = (data: { groupId: string; messageId: string; content: string; editedAt: Date }) => {
      if (data.groupId === groupId) {
        editMessage(groupId, data.messageId, data.content)
      }
    }

    // Listen for message deletes from other users
    const handleMessageDeleted = (data: { groupId: string; messageId: string }) => {
      if (data.groupId === groupId) {
        deleteMessage(groupId, data.messageId)
      }
    }

    socket.on('group:message:edited', handleMessageEdited)
    socket.on('group:message:deleted', handleMessageDeleted)

    return () => {
      socket.emit('group:leave', { groupId })
      socket.off('group:message:edited', handleMessageEdited)
      socket.off('group:message:deleted', handleMessageDeleted)
    }
  }, [socket, groupId, editMessage, deleteMessage])

  // Handle reply action
  const handleReply = useCallback((message: GroupMessage) => {
    clearEditingMessage()
    setReplyingTo(message)
  }, [setReplyingTo, clearEditingMessage])

  // Handle edit action - set editing mode
  const handleEdit = useCallback((message: GroupMessage) => {
    clearReplyingTo()
    setEditingMessage(message)
  }, [setEditingMessage, clearReplyingTo])

  // Handle edit message submission
  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to edit message')
      }

      const updated = await res.json()
      editMessage(groupId, messageId, content)
      clearEditingMessage()

      // Broadcast to other users via socket
      if (socket) {
        socket.emit('group:message:edit', {
          groupId,
          messageId,
          content,
          editedAt: updated.editedAt,
        })
      }

      toast.success('Message edited')
    } catch (error) {
      toast.error((error as Error).message || 'Failed to edit message')
    }
  }, [groupId, socket, editMessage, clearEditingMessage])

  // Handle delete for me
  const handleDeleteForMe = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages/${messageId}?type=forMe`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete message')
      }

      hideMessage(groupId, messageId)
      toast.success('Message deleted for you')
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete message')
    }
  }, [groupId, hideMessage])

  // Handle delete for all
  const handleDeleteForAll = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages/${messageId}?type=forAll`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete message')
      }

      deleteMessage(groupId, messageId)

      // Broadcast to other users via socket
      if (socket) {
        socket.emit('group:message:delete', {
          groupId,
          messageId,
        })
      }

      toast.success('Message deleted for everyone')
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete message')
    }
  }, [groupId, socket, deleteMessage])

  const handleSendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!session?.user?.id || !activeGroup || !socket) return

      const tempId = `temp-${Date.now()}`
      
      // Get the replied message info for optimistic update
      const repliedMessage = replyToId 
        ? (messages[groupId] || []).find(m => m.id === replyToId)
        : null

      // Optimistic update
      const tempMessage: GroupMessage = {
        id: tempId,
        content,
        senderId: session.user.id,
        senderName: session.user.name || 'You',
        senderImage: session.user.image || null,
        isAI: false,
        createdAt: new Date(),
        replyTo: repliedMessage ? {
          id: repliedMessage.id,
          content: repliedMessage.content,
          senderName: repliedMessage.senderName,
          isAI: repliedMessage.isAI,
        } : null,
      }
      addMessage(groupId, tempMessage)
      clearReplyingTo()

      // Check for @shipper mention
      const hasShipperMention = /@shipper\b/i.test(content)
      
      // Check if replying to an AI message
      const isReplyingToAI = repliedMessage?.isAI === true

      // Determine if AI should respond
      const shouldTriggerAI = (hasShipperMention || isReplyingToAI) && activeGroup.aiEnabled

      try {
        // Send via socket for real-time delivery
        socket.emit('group:message:send', {
          groupId,
          content,
          tempId,
          replyToId,
        })

        // If AI should respond
        if (shouldTriggerAI) {
          setAiTyping(true)
          clearStreamingContent()

          abortControllerRef.current = new AbortController()

          const aiRes = await fetch(`/api/groups/${groupId}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              replyToId: tempId, // AI replies to the user's message
              triggerContent: content,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (aiRes.ok) {
            const reader = aiRes.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
              let fullContent = ''

              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6))
                      if (data.text) {
                        fullContent += data.text
                        setStreamingContent(fullContent)
                      }
                      if (data.done) {
                        const aiMessage: GroupMessage = {
                          id: data.messageId || `ai-${Date.now()}`,
                          content: fullContent,
                          senderId: null,
                          senderName: 'Shipper',
                          senderImage: null,
                          isAI: true,
                          createdAt: new Date(),
                          replyTo: data.replyTo || {
                            id: tempId,
                            content: content,
                            senderName: session.user.name || 'You',
                            isAI: false,
                          },
                        }
                        addMessage(groupId, aiMessage)
                        clearStreamingContent()
                        
                        // Broadcast AI message to other group members via socket
                        if (socket) {
                          socket.emit('group:ai:message', {
                            groupId,
                            message: aiMessage,
                          })
                        }
                      }
                    } catch {}
                  }
                }
              }
            }
          }
          setAiTyping(false)
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to send message')
        }
        setAiTyping(false)
      }
    },
    [session, activeGroup, groupId, socket, messages, addMessage, setAiTyping, clearStreamingContent, setStreamingContent, clearReplyingTo]
  )

  const handleCreateGroup = async (data: { name: string; description?: string; memberIds: string[] }) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create group')

      const newGroup = await res.json()
      addGroup({ ...newGroup, myRole: 'admin', lastMessage: null })
      toast.success('Group created!')
      router.push(`/groups/${newGroup.id}`)
    } catch (error) {
      toast.error('Failed to create group')
      throw error
    }
  }

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete group')
      removeGroup(id)
      toast.success('Group deleted')
      if (id === groupId) router.push('/groups')
    } catch (error) {
      toast.error('Failed to delete group')
    }
  }

  const handleUpdateGroup = async (updates: { name?: string; description?: string; aiEnabled?: boolean }) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update group')
      const updated = await res.json()
      if (activeGroup) {
        setActiveGroup({ ...activeGroup, ...updated })
      }
      toast.success('Group updated')
    } catch (error) {
      toast.error('Failed to update group')
    }
  }

  const handleAddMembers = async (userIds: string[]) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      })
      if (!res.ok) throw new Error('Failed to add members')
      const data = await res.json()
      data.members.forEach((m: any) => {
        addMember({
          id: m.id,
          name: m.name,
          image: m.image,
          isOnline: false,
          role: 'member',
          joinedAt: new Date(),
        })
      })
      toast.success(`Added ${data.added} member(s)`)
    } catch (error) {
      toast.error('Failed to add members')
      throw error
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove member')
      removeMember(userId)
      toast.success('Member removed')
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  const handleUpdateRole = async (userId: string, role: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      updateMemberRole(userId, role)
      toast.success('Role updated')
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleLeaveGroup = async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${session.user.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to leave group')
      removeGroup(groupId)
      toast.success('Left group')
      router.push('/groups')
    } catch (error) {
      toast.error('Failed to leave group')
    }
  }

  const handleDeleteGroupFromSettings = async () => {
    await handleDeleteGroup(groupId)
    setSettingsOpen(false)
  }

  const groupMessages = messages[groupId] || []

  return (
    <div className="flex h-full pb-14 md:pb-0 md:gap-4">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-16 left-2 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Groups sidebar */}
      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-200 md:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'top-14 md:top-0 h-[calc(100%-3.5rem)] md:h-full'
        )}
      >
        <div className="p-3">
          <Link href="/chat">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chats
            </Button>
          </Link>
        </div>
        <GroupList
          groups={groups}
          activeGroupId={groupId}
          onSelect={(id) => {
            router.push(`/groups/${id}`)
            setSidebarOpen(false)
          }}
          onCreateNew={() => setCreateModalOpen(true)}
          onDelete={handleDeleteGroup}
          onSettings={(id) => {
            if (id === groupId) setSettingsOpen(true)
            else router.push(`/groups/${id}?settings=true`)
          }}
        />
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeGroup ? (
          <>
            <GroupHeader
              group={activeGroup}
              onSettingsClick={() => setSettingsOpen(true)}
            />
            <GroupChat
              group={activeGroup}
              messages={groupMessages}
              currentUserId={session?.user?.id || ''}
              isLoading={isLoadingMessages}
              aiTyping={aiTyping}
              streamingContent={streamingContent}
              replyingTo={replyingTo}
              editingMessage={editingMessage}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onReply={handleReply}
              onCancelReply={clearReplyingTo}
              onEdit={handleEdit}
              onCancelEdit={clearEditingMessage}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForAll={handleDeleteForAll}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateGroup={handleCreateGroup}
      />

      {activeGroup && (
        <>
          <MemberSearchModal
            open={addMemberModalOpen}
            onOpenChange={setAddMemberModalOpen}
            groupId={groupId}
            onAddMembers={handleAddMembers}
          />

          <GroupSettings
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            group={activeGroup}
            currentUserId={session?.user?.id || ''}
            onUpdateGroup={handleUpdateGroup}
            onAddMembers={() => {
              setSettingsOpen(false)
              setAddMemberModalOpen(true)
            }}
            onRemoveMember={handleRemoveMember}
            onUpdateRole={handleUpdateRole}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroupFromSettings}
          />
        </>
      )}
    </div>
  )
}
