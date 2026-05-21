'use client'

import { getSpellsForClass } from '@/data/spells/index'

interface Props {
  classId: string
  equippedSpells: string[]
}

export function Spells({ classId, equippedSpells }: Props) {
  const available = getSpellsForClass(classId)
  if (available.length === 0) return null

  return (
    <div className="rounded border border-amber-800 bg-zinc-800 p-3">
      <span className="text-xs font-bold text-amber-400">SPELLS</span>
      <ul className="mt-2 space-y-1">
        {equippedSpells.map(id => {
          const spell = available.find(s => s.id === id)
          return (
            <li key={id} className="text-sm">
              <span className="font-semibold text-amber-200">{spell?.name ?? id}</span>
              {spell && <span className="ml-2 text-zinc-400 text-xs">{spell.description}</span>}
            </li>
          )
        })}
        {equippedSpells.length === 0 && <li className="text-sm text-zinc-500">No spells prepared.</li>}
      </ul>
    </div>
  )
}
