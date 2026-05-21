'use client'

import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getItem } from '@/data/equipment/index'
import { modifierStr } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

interface Props {
  name: string
  classId: string
  ancestryId: string
  stats: Record<Stat, number>
  hpMax: number
  equipment: { itemId: string; slots: number }[]
  spells: string[]
}

export function StepReview({ name, classId, ancestryId, stats, hpMax, equipment, spells }: Props) {
  const cls = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  return (
    <div className="space-y-4">
      <div className="rounded border border-amber-700 bg-zinc-800 p-3">
        <h3 className="font-bold text-amber-400">{name || '(no name)'}</h3>
        <p className="text-sm text-zinc-300">{cls?.name ?? classId} · {ancestry?.name ?? ancestryId} · HP {hpMax}</p>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {statKeys.map(k => (
          <div key={k} className="text-center rounded bg-zinc-800 p-1">
            <p className="text-xs text-amber-400">{STAT_LABELS[k]}</p>
            <p className="text-lg font-bold text-white">{stats[k]}</p>
            <p className="text-xs text-zinc-400">{modifierStr(stats[k])}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-bold text-amber-400 mb-1">EQUIPMENT</p>
        <ul className="space-y-1">
          {equipment.map((e, i) => (
            <li key={i} className="text-sm text-zinc-300">• {getItem(e.itemId)?.name ?? e.itemId}</li>
          ))}
        </ul>
      </div>
      {spells.length > 0 && (
        <div>
          <p className="text-xs font-bold text-amber-400 mb-1">SPELLS</p>
          <ul className="space-y-1">
            {spells.map(id => <li key={id} className="text-sm text-zinc-300">• {id}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
