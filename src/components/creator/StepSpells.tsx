'use client'

import { getSpellsForClass } from '@/data/spells/index'

interface Props {
  classId: string
  selectedSpells: string[]
  onChange: (spells: string[]) => void
}

export function StepSpells({ classId, selectedSpells, onChange }: Props) {
  const available = getSpellsForClass(classId)
  if (available.length === 0) return <p className="text-zinc-400 text-sm">No spells available for this class.</p>

  function toggle(id: string) {
    if (selectedSpells.includes(id)) {
      onChange(selectedSpells.filter(s => s !== id))
    } else {
      onChange([...selectedSpells, id])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">Select your starting spells.</p>
      {available.map(spell => {
        const selected = selectedSpells.includes(spell.id)
        return (
          <button
            key={spell.id}
            onClick={() => toggle(spell.id)}
            className={`w-full rounded border p-3 text-left transition-colors ${selected ? 'border-amber-500 bg-amber-900' : 'border-zinc-700 bg-zinc-800 hover:border-amber-700'}`}
          >
            <div className="flex justify-between">
              <span className="font-bold text-white">{spell.name}</span>
              <span className="text-xs text-zinc-400">Tier {spell.tier}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{spell.description}</p>
          </button>
        )
      })}
    </div>
  )
}
