'use client'

import { Button } from '@/components/ui/button'
import { QUICK_ACTIONS, QuickActionType } from '@/lib/ai/games'

interface QuickActionsProps {
  onAction: (action: QuickActionType) => void
  disabled?: boolean
}

const actionOrder: QuickActionType[] = [
  'hype-me',
  'pickup-line', 
  'would-you-rather',
  'roast-me',
  'compliment-me',
]

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {actionOrder.map((key) => {
        const action = QUICK_ACTIONS[key]

        return (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => onAction(key)}
            disabled={disabled}
            className="shrink-0 gap-1.5 rounded-full"
          >
            <span>{action.emoji}</span>
            <span className="text-xs">{action.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
