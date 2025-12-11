'use client'

import { useState } from 'react'
import { Check, Clock, AlertCircle, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Task {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignee: { id: string; name: string | null; image?: string | null }
  createdBy?: { id: string; name: string | null } | null
  dueDate?: string | null
  createdAt: string
  completedAt?: string | null
}

interface TaskListProps {
  tasks: Task[]
  currentUserId: string
  onMarkDone: (taskId: string) => void
  onDelete: (taskId: string) => void
  isLoading?: boolean
}

export function TaskList({
  tasks,
  currentUserId,
  onMarkDone,
  onDelete,
  isLoading,
}: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'done'>('all')

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'mine') return task.assignee.id === currentUserId
    if (filter === 'pending') return task.status === 'pending' || task.status === 'in_progress'
    if (filter === 'done') return task.status === 'done'
    return true
  })

  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading tasks...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'mine', 'pending', 'done'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="text-xs"
          >
            {f === 'all' && `All (${tasks.length})`}
            {f === 'mine' && 'My Tasks'}
            {f === 'pending' && `Pending (${pendingCount})`}
            {f === 'done' && `Done (${doneCount})`}
          </Button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              onMarkDone={onMarkDone}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskItem({
  task,
  currentUserId,
  onMarkDone,
  onDelete,
}: {
  task: Task
  currentUserId: string
  onMarkDone: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isDone = task.status === 'done'
  const isOwn = task.assignee.id === currentUserId
  const canDelete = task.createdBy?.id === currentUserId || isOwn

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        isDone && 'bg-muted/50 opacity-70',
        task.priority === 'high' && !isDone && 'border-orange-300 dark:border-orange-800',
        task.priority === 'urgent' && !isDone && 'border-red-400 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
      )}
    >
      <button
        onClick={() => !isDone && onMarkDone(task.id)}
        disabled={isDone}
        className={cn(
          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors',
          isDone
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-muted-foreground/30 hover:border-primary'
        )}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', isDone && 'line-through text-muted-foreground')}>
          {task.description}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assignee.name || 'Unknown'}
          </span>
          {task.priority !== 'normal' && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                task.priority === 'low' && 'bg-gray-100 dark:bg-gray-800',
                task.priority === 'high' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
                task.priority === 'urgent' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              )}
            >
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {canDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

