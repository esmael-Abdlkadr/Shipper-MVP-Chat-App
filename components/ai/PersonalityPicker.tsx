'use client'

import { cn } from '@/lib/utils'
import { PERSONALITIES, PersonalityType } from '@/lib/ai/config'

interface PersonalityPickerProps {
  selected: PersonalityType
  onChange: (personality: PersonalityType) => void
}

const personalities: PersonalityType[] = ['hype', 'flirty']

export function PersonalityPicker({ selected, onChange }: PersonalityPickerProps) {
  return (
    <div className="flex gap-2">
      {personalities.map((key) => {
        const personality = PERSONALITIES[key]
        const isSelected = selected === key

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-medium',
              isSelected 
                ? 'border-primary bg-primary text-primary-foreground shadow-lg' 
                : 'border-border hover:border-primary/50 hover:bg-muted'
            )}
          >
            <span className="text-lg">{personality.emoji}</span>
            <span className="text-sm">{personality.name}</span>
          </button>
        )
      })}
    </div>
  )
}
