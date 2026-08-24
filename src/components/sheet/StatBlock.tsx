'use client'

import { useState } from 'react'
import { modifier, rollWithMode } from '@/lib/dice'
import type { RollMode, RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import { STAT_FULL, STAT_LABELS } from '@/data/stats'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { cn } from '@/lib/utils'

interface Props {
  stats: Record<Stat, number>
  onRoll?: (result: RollResult) => void
}

export function StatBlock({ stats, onRoll }: Props) {
  const [pulsedStat, setPulsedStat] = useState<Stat | null>(null)
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  function handleRollType(stat: Stat, mode: RollMode) {
    if (!onRoll) return
    const result = rollWithMode('d20', STAT_FULL[stat], STAT_LABELS[stat], modifier(stats[stat]), mode)
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
          // Os três últimos atributos abrem para a borda inicial, senão o menu
          // sairia da grade de seis.
          <RollModeMenu
            key={key}
            label={`Rolar ${STAT_FULL[key]}`}
            align={idx >= 3 ? 'end' : 'center'}
            onRoll={mode => handleRollType(key, mode)}
            className="group/stat"
          >
            {card}
          </RollModeMenu>
        )
      })}
    </div>
  )
}
