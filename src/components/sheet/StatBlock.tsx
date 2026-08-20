'use client'

import { useState } from 'react'
import { modifier, rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import { STAT_FULL, STAT_LABELS } from '@/data/stats'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const ROLL_TYPES = [
  { id: 'normal' as const, label: 'Normal', className: 'text-[var(--foreground)]' },
  { id: 'advantage' as const, label: '✦ Vantagem', className: 'text-[var(--chart-2)]' },
  { id: 'disadvantage' as const, label: '✕ Desvantagem', className: 'text-[var(--destructive)]' },
]

interface Props {
  stats: Record<Stat, number>
  onRoll?: (result: RollResult) => void
}

export function StatBlock({ stats, onRoll }: Props) {
  const [pulsedStat, setPulsedStat] = useState<Stat | null>(null)
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  function handleRollType(stat: Stat, type: 'normal' | 'advantage' | 'disadvantage') {
    if (!onRoll) return
    const mod = modifier(stats[stat])
    const result = rollDie(
      'd20',
      `${STAT_FULL[stat]}`,
      STAT_LABELS[stat],
      mod,
      type === 'advantage',
      type === 'disadvantage',
    )
    onRoll(result)
    setPulsedStat(stat)
    setTimeout(() => setPulsedStat(s => (s === stat ? null : s)), 450)
  }

  return (
    <div className="grid-stats">
      {statKeys.map((key, idx) => {
        const mod = modifier(stats[key])
        const isInteractive = !!onRoll

        const card = (
          <div
            className={cn(
              'relative w-full border px-0.5 pt-2 pb-2.5 text-center select-none',
              'bg-input border-input transition-all duration-300',
              'group-data-popup-open/stat:bg-accent group-data-popup-open/stat:border-accent',
              isInteractive ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <div className="font-mono text-muted-foreground group-data-popup-open/stat:text-accent-foreground mb-0.5 text-[10px] tracking-[0.12em] uppercase transition-colors duration-300">
              {STAT_LABELS[key]}
            </div>

            <div
              key={pulsedStat === key ? 'pulse' : 'idle'}
              className={cn(
                'font-heading text-2xl leading-none font-bold',
                'group-data-popup-open/stat:text-accent-foreground',
                pulsedStat === key && 'animate-value-pulse',
                mod > 0
                  ? 'text-[var(--chart-2)]'
                  : mod < 0
                    ? 'text-[var(--destructive)]'
                    : 'text-muted-foreground',
              )}
            >
              {mod > 0 ? `+${mod}` : mod}
            </div>

            <div className="font-mono text-muted-foreground group-data-popup-open/stat:text-accent-foreground mt-0.5 text-[10px]">
              {stats[key]}
            </div>
          </div>
        )

        if (!isInteractive) return <div key={key}>{card}</div>

        return (
          <DropdownMenu key={key}>
            <DropdownMenuTrigger
              className="group/stat outline-none"
              aria-label={`Rolar ${STAT_FULL[key]}`}
            >
              {card}
            </DropdownMenuTrigger>

            {/* The last three stats open toward the start edge so the menu
                stays inside the six-up grid. */}
            <DropdownMenuContent
              align={idx >= 3 ? 'end' : 'center'}
              sideOffset={4}
              className="border-t-primary w-auto min-w-[130px] border-t-4 p-0"
            >
              {ROLL_TYPES.map(opt => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => handleRollType(key, opt.id)}
                  className={cn(
                    'px-3.5 py-2.5 text-[13px] italic not-last:border-b not-last:border-[var(--border)]',
                    opt.className,
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>
  )
}
