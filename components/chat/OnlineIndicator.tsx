'use client'

import { cn } from '@/lib/utils'

interface OnlineIndicatorProps {
  isOnline: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function OnlineIndicator({ isOnline, size = 'md', className }: OnlineIndicatorProps) {
  if (!isOnline) return null

  return (
    <span className={cn('relative flex', className)}>
      {/* Pulse ring */}
      <span 
        className={cn(
          'absolute inline-flex rounded-full bg-green-400 opacity-75 animate-pulse-ring',
          sizeClasses[size]
        )} 
      />
      {/* Solid dot */}
      <span 
        className={cn(
          'relative inline-flex rounded-full bg-green-500 border-2 border-background',
          sizeClasses[size]
        )} 
      />
    </span>
  )
}

