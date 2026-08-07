'use client'

import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  level: number
  xp: number
  onUpdate: (xp: number) => void
}

export function XPBar({ level, xp, onUpdate }: Props) {
  const nextXp = level * 10
  const pct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100
  const ready = pct >= 100

  return (
    <div className="flex flex-1 items-center gap-2">
      <Progress value={pct} className="min-w-0 flex-1 gap-0" aria-label="Progresso de XP">
        <ProgressTrack className="h-[3px] rounded-sm bg-black/35">
          <ProgressIndicator
            className={cn(
              'transition-[width] duration-[400ms] ease-[var(--ease-ritual)]',
              ready
                ? 'bg-[var(--gold-bright)] shadow-[0_0_5px_color-mix(in_oklch,var(--chart-1),transparent_60%)]'
                : 'bg-[var(--verdigris-light)]',
            )}
          />
        </ProgressTrack>
      </Progress>

      <div className="flex shrink-0 items-center gap-[3px]">
        <Input
          type="number"
          value={xp}
          min={0}
          onChange={e => onUpdate(Math.max(0, parseInt(e.target.value) || 0))}
          aria-label="XP atual"
          className={cn(
            'font-mono h-auto w-[34px] border-none bg-transparent p-0 text-right text-[10px]',
            ready ? 'text-[var(--gold-bright)]' : 'text-[var(--parchment-light)]',
          )}
        />
        <span className="font-mono text-muted-foreground text-[10px] whitespace-nowrap">
          / {nextXp} XP
        </span>
      </div>
    </div>
  )
}
