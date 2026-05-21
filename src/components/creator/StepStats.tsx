'use client'

import { rollStats, modifier, modifierStr } from '@/lib/dice'
import { canReroll } from '@/lib/reroll'
import type { Stat } from '@/types/class.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

interface Props {
  stats: Record<Stat, number>
  onChange: (stats: Record<Stat, number>) => void
}

export function StepStats({ stats, onChange }: Props) {
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const statValues = statKeys.map(k => stats[k])
  const canRoll = canReroll(statValues)

  function handleRoll() {
    onChange(rollStats() as Record<Stat, number>)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleRoll}
        className="w-full rounded bg-amber-700 py-2 font-bold text-white hover:bg-amber-600"
      >
        🎲 Roll 3d6 per stat
      </button>
      {canRoll && statValues.some(v => v > 0) && (
        <p className="text-center text-xs text-amber-400">No stat exceeds 14 — you may re-roll!</p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {statKeys.map(key => {
          const mod = modifier(stats[key])
          return (
            <div key={key} className="flex flex-col items-center rounded border border-amber-800 bg-zinc-800 p-2">
              <span className="text-xs font-bold text-amber-400">{STAT_LABELS[key]}</span>
              <span className="text-2xl font-bold text-white">{stats[key] || '—'}</span>
              {stats[key] > 0 && (
                <span className={`text-sm ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {modifierStr(stats[key])}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
