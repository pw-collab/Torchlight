'use client'

import { NumInput } from '@/components/sheet/NumInput'
import { cn } from '@/lib/utils'

/**
 * A bonus the player keeps by hand, on the raised tile the attributes use:
 * the label over the number, edited in place. The character card's second
 * column shows them under the equipment (melee, ranged) and under the
 * spellcasting (Figma 353:1089).
 */
export function BonusTile({ label, value, onCommit, className }: {
  label: string
  value: number
  onCommit: (next: number) => void
  className?: string
}) {
  return (
    <div className={cn('border-2 border-[var(--border-frame)] bg-[var(--bg-raised)] p-2 text-center', className)}>
      <div className="type-label text-muted-foreground mb-1 leading-[1.5]">{label}</div>
      <NumInput
        value={value}
        aria-label={label}
        onCommit={onCommit}
        className={cn(
          'font-heading h-auto cursor-text border-none bg-transparent p-0 text-[20px] font-bold',
          value > 0
            ? 'text-[var(--chart-2)]'
            : value < 0
              ? 'text-destructive'
              : 'text-[var(--foreground)]',
        )}
      />
    </div>
  )
}
