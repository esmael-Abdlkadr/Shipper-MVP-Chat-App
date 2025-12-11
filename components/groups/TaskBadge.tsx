'use client'

import { ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskBadgeProps {
  count: number
  onClick?: () => void
  className?: string
}

export function TaskBadge({ count, onClick, className }: TaskBadgeProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors',
        className
      )}
    >
      <ClipboardList className="h-3 w-3" />
      {count} task{count !== 1 ? 's' : ''}
    </button>
  )
}

