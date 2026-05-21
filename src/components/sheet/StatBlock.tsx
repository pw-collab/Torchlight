'use client'

import { modifier, modifierStr } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

interface Props {
  stats: Record<Stat, number>
}

export function StatBlock({ stats }: Props) {
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {statKeys.map(key => {
        const mod = modifier(stats[key])
        return (
          <div key={key} className="flex flex-col items-center rounded border border-amber-800 bg-zinc-800 p-2">
            <span className="text-xs font-bold text-amber-400">{STAT_LABELS[key]}</span>
            <span className="text-2xl font-bold text-white">{stats[key]}</span>
            <span className={`text-sm font-semibold ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {modifierStr(stats[key])}
            </span>
          </div>
        )
      })}
    </div>
  )
}
