'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupList, CreateGroupModal } from '@/components/groups'
import { useGroupStore, Group } from '@/stores/useGroupStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function GroupsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { groups, setGroups, addGroup, removeGroup, setLoading, isLoading } = useGroupStore()

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }, [setGroups, setLoading])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleSelectGroup = (id: string) => {
    router.push(`/groups/${id}`)
    setSidebarOpen(false)
  }

  const handleCreateGroup = async (data: { name: string; description?: string; memberIds: string[] }) => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create group')

      const newGroup = await res.json()
      addGroup({
        ...newGroup,
        myRole: 'admin',
        lastMessage: null,
      })
      
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
    } catch (error) {
      toast.error('Failed to delete group')
    }
  }

  const handleSettings = (id: string) => {
    router.push(`/groups/${id}?settings=true`)
  }

  return (
    <div className="flex h-full pb-14 md:pb-0">
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
        <GroupList
          groups={groups}
          activeGroupId={null}
          onSelect={handleSelectGroup}
          onCreateNew={() => setCreateModalOpen(true)}
          onDelete={handleDeleteGroup}
          onSettings={handleSettings}
        />
      </aside>

      {/* Main content - Welcome screen */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Group Chats</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Create a group to chat with friends, family, or colleagues. You can even invite @shipper to join the conversation!
        </p>
        <Button onClick={() => setCreateModalOpen(true)} size="lg">
          Create New Group
        </Button>
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}

